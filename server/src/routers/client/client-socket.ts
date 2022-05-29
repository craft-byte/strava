import { ObjectId } from "mongodb";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { Order } from "../../models/components";
import { ClientResponse } from "../../models/responses";
import { id, log } from "../../utils/functions";
import { Orders } from "../../utils/restaurant";
import { updateUser } from "../../utils/users";
import { sortDishesForKitchen } from "../staff/kitchen/functions";

interface DishShort {
    dishId: ObjectId;
    _id: ObjectId;
    comment: string;
}

class Session {

    table!: number;
    socketId!: string;
    restaurantId!: ObjectId;
    userId!: ObjectId;
    dishes: DishShort[] = [];

    constructor() { }

    async init(restaurantId: string, userId: string, table: number, socketId: string) {

        this.restaurantId = id(restaurantId)!;
        this.userId = id(userId)!;
        this.table = table;
        this.socketId = socketId;

        const result = await updateUser(this.userId,
          [
            {
              $set: {
                sessions: {
                  $cond: [
                    {
                      $in: [
                        this.restaurantId,
                        "$sessions.restaurantId"
                      ]
                    },
                    {
                      $map: {
                        input: "$sessions",
                        as: "session",
                        in: {
                          $cond: [
                            {
                              $eq: [
                                "$$session.restaurantId",
                                this.restaurantId
                              ]
                            },
                            {
                              $mergeObjects: [
                                "$$session",
                                {
                                  date: new Date()
                                }
                              ]
                            },
                            "$$session"
                          ]
                        }
                      }
                    },
                    {
                      $concatArrays: [
                        "$sessions",
                        [
                          {
                            restaurantId: this.restaurantId,
                            date: new Date(),
                            dishes: []
                          }
                        ]
                      ]
                    }
                  ]
                }
              }
            }
          ]);

        console.log("i got this thing working on the first try :)", result.modifiedCount > 0);

        // const session: any = await aggregateUser([
        //     {
        //         $match: { _id: this.userId },
        //     },
        //     {
        //         $unwind: "$sessions"
        //     },
        //     {
        //         $match: { "sessions.restaurantId": this.restaurantId }
        //     },
        //     {
        //         $project: { "session": "$sessions" }
        //     }
        // ]);
        // if(session && session[0]) {
        //     this.dishes = session[0].dishes;
        // }


        Orders(this.restaurantId).updateIds(this.userId, socketId);
    }
    async addOrder(dishes: string[]): Promise<Order | null> {

        if(!dishes || dishes.length == 0) {
            return null;
        }

        const order = await Orders(this.restaurantId).create(
            this.userId,
            this.socketId,
            this.table,
            dishes
        );

        return order;
    }
    async addDish(data: any) {
        if(!data.dishId || data.dishId.length != 24) {
            return;
        }

        const newDish = {
            dishId: id(data.dishId)!,
            comment: data.comment,
            _id: id()!,
        }

        this.dishes.push(newDish);

        const result = await updateUser(this.userId, { $push: { "sessions.$[restaurantId].dishes": newDish } }, { arrayFilters: [ { "restaurantId.restaurantId": this.restaurantId } ] });

        console.log("dish added: ", result.modifiedCount > 0);
    }
    async removeDish(_id: string) {
        if(!_id || _id.length != 24) {
            return;
        }
        for(let i in this.dishes) {
            if(this.dishes[i].dishId.equals(_id)) {
                this.dishes.splice(+1, 1);
                break;
            }
        }

        const result = await updateUser(this.userId, { $pull: { "sessions.$[restaurantId].dishes": { _id: id(_id) } } }, { arrayFilters: [ { "restaurantId.restaurantId": this.restaurantId } ] });

        console.log("dish removed: ", result.modifiedCount > 0);
    }
}


function ClientSocket(socket: Socket) {
    const subs = new Subject<ClientResponse>();


    let session: Session;


    socket.on("client/init", async ({ restaurantId, userId, data }: {
        restaurantId: string;
        userId: string;
        data: {
            table: number;
        }
    }) => {

        log("info", "innitting a client");
        
        session = new Session()
        session.init(
            restaurantId,
            userId,
            data.table,
            socket.id
        );

        subs.next({
            type: "access",
            data: { access: true },
            send: [ socket.id ]
        });
    });
    socket.on("client/dish/add", async (data) => {
        if(!session) {
            return;
        }
        session.addDish(data);
    });
    socket.on("client/dish/remove", async ({ dishId }) => {
        if(!session) {
            return;
        }
        session.removeDish(dishId);
    });
    socket.on("order/confirm", async ({ dishes }: {
        dishes: string[]
    }) => {

        if(!session) {
            return;
        }


        log("info", "confirming order");

        if(dishes.length == 0) {
            return;
        }

        const send = await session.addOrder(dishes);

        if(!send) {
            log("error", "no order submited, no dishes");
        }

        const sorted = (await sortDishesForKitchen(session.restaurantId, [send!])).dishes;
        

        subs.next({
            type: "kitchen/order/new",
            event: "kitchen",
            data: sorted,
            send: [`${session.restaurantId.toString()}/kitchen`]
        });

    });


    return subs;
}



export {
    ClientSocket
}