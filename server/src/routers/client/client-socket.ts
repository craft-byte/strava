import { ObjectId } from "mongodb";
import { Subject } from "rxjs";
import { BoolEnum } from "sharp";
import { Socket } from "socket.io";
import { Id, Order } from "../../models/components";
import { ClientResponse } from "../../models/responses";
import { id } from "../../utils/functions";
import { getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { checkSession } from "./functions";

interface DishShort {
  dishId: ObjectId;
  _id: ObjectId;
  comment: string;
}

class Session {

  info!: { type: "order" | "table", number: number };
  restaurantId!: ObjectId;
  userId!: ObjectId;
  sessionId!: ObjectId;
  dishes: DishShort[] = [];

  constructor(
    private convertRestaurantId: string,
    private convertUserId: string,
    public socketId: string,
    private type: "order" | "table",
    private number: number
  ) {
    this.restaurantId = id(this.convertRestaurantId)!;
    this.userId = id(this.convertUserId)!
  }

  async init() {

    try {

      const sessionId = id()!;

      const result = await Restaurant(this.restaurantId).sessions.create({
        userId: this.userId,
        type: this.type,
        number: this.number,
        _id: sessionId,
        dishes: [],
        date: new Date(),
      });

      console.log("session created/updated: ", result.modifiedCount > 0);

      if (result.modifiedCount > 0) {
        this.sessionId = sessionId;
        return sessionId;
      }

      return null;
    } catch (e) {
      console.error(e);
    }



    Orders(this.restaurantId).updateIds(this.userId, this.socketId);
  }
  async addOrder(): Promise<Order | null> {
    return new Promise(async (res, rej) => {
      const session = await Restaurant(this.restaurantId).sessions.userId(this.userId).get();

      if (!session) {
        console.log("NO SESSIOn");
        return res(null);
      }

      const order = await Orders(this.restaurantId).create(
        this.userId,
        this.socketId,
        this.info,
        session.dishes!
      );

      const sessionUpdate = await Restaurant(this.restaurantId).update({ $set: { "sessions.$[sessionId].dishes": [] } }, { arrayFilters: [{ "sessionId._id": session._id }] });

      if (sessionUpdate?.modifiedCount == 0) {
        console.log("SESSION IS NOT UPDATED!!!!!!!!!");
      }

      res(order);

      for (let i of session.dishes!) {
        Restaurant(this.restaurantId).dishes.one(i.dishId)
          .update({ $inc: { bought: 1 } });
      }
    });
  }
  async addDish(data: any) {
    if (!data.dishId || data.dishId.length != 24) {
      return;
    }

    const newDish = {
      dishId: id(data.dishId)!,
      comment: data.comment,
      _id: id()!,
    }

    this.dishes.push(newDish);

    const result = await Restaurant(this.restaurantId)
      .update(
        { $push: { "sessions.$[sessionId].dishes": newDish } },
        { arrayFilters: [{ "sessionId.userId": this.userId }] }
      );

    console.log("dish added: ", result!.modifiedCount > 0);
  }
  async removeDish(_id: string) {
    if (!_id || _id.length != 24) {
      return;
    }
    for (let i in this.dishes) {
      if (this.dishes[i].dishId.equals(_id)) {
        this.dishes.splice(+1, 1);
        break;
      }
    }

    const result = await Restaurant(this.restaurantId).update({ $pull: { "sessions.$[sessionId].dishes": { _id: id(_id) } } }, { arrayFilters: [{ "sessionId.userId": id(this.userId) }] });

    console.log("dish removed: ", result!.modifiedCount > 0);
  }
}


function ClientSocket(socket: Socket) {
  const subs = new Subject<ClientResponse>();


  let session: Session;


  socket.on("client/init", async ({ restaurantId, userId, data }: {
    restaurantId: string;
    userId: string;
    data: {
      type: "order" | "table";
      number: number;
      force?: boolean;
    }
  }) => {

    // const { type, number } = data;

    // if (type == "order") {

    //   const restaurant = await Restaurant(restaurantId).get({ projection: { settings: 1 } });

    //   if (!restaurant) {
    //     return;
    //   }

    //   if (restaurant.settings!.customers.allowDistanceOrders) {

    //     const number = Math.floor(Math.random() * 10000);

    //     session = new Session(
    //       restaurantId,
    //       userId,
    //       socket.id,
    //       type,
    //       number!
    //     );

    //     const sessionId = await session.init();

    //     return subs.next({
    //       type: "access",
    //       data: { access: true, number, sessionId, },
    //       send: [socket.id]
    //     });
    //   }
    //   session = null!;
    //   return subs.next({
    //     type: "access",
    //     data: { access: false },
    //     send: [socket.id]
    //   });
    // }


    // const check = await checkSession(restaurantId, type, number);

    // if (check.askToChange && !data.force) {
    //   session = null!;
    //   return subs.next({
    //     type: "access",
    //     data: { access: false, ...check, number },
    //     send: [socket.id]
    //   });
    // }

    // if (check.hasToChange) {
    //   session = null!;
    //   return subs.next({
    //     type: "access",
    //     data: { access: false, ...check, number },
    //     send: [socket.id]
    //   });
    // }


    // session = new Session(
    //   restaurantId,
    //   userId,
    //   socket.id,
    //   type,
    //   number!
    // );

    // const sessionId = await session.init();


    subs.next({
      type: "access",
      // data: { access: true, number, sessionId },
      send: [socket.id]
    });
  });
  socket.on("client/dish/add", async (data) => {
    if (!session) {
      return;
    }
    session.addDish(data);
  });
  socket.on("client/dish/remove", async ({ dishId }) => {
    if (!session) {
      return;
    }
    session.removeDish(dishId);
  });
  socket.on("client/confirm", async () => {

    if (!session) {
      return;
    }

    const order = await session.addOrder();


    if (!order) {
      console.log("NOT IMPOLENENEEEETEDX client/confirm");
      return;
    }

    const ids = new Set<string>();

    for (let i of order.dishes!) {
      ids.add(i.dishId.toString());
    }

    const dishes = await Restaurant(session.restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).get({ projection: { general: 1, } });

    const result = [];
    const time = getDelay(order.time!);
    for (let i in order.dishes!) {
      for (let { general, _id } of dishes) {
        if (_id.equals(order.dishes[i].dishId)) {
          result.push({
            orderId: order._id,
            ...order.dishes![i],
            time,
            general: general
          });
        }
      }
    }


    subs.next({
      type: "kitchen/order/new",
      event: "kitchen",
      data: result,
      send: [`${session.restaurantId.toString()}/kitchen`]
    });

  });


  return subs;
}



export {
  ClientSocket
}