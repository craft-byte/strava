import { ObjectId } from "mongodb";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import {  WaiterResponse } from "../../../models/responses";
import { DishesHashTable } from "../../../utils/dish";
import { id } from "../../../utils/functions";
import { getDelay } from "../../../utils/other";
import { Restaurant, Stats } from "../../../utils/restaurant";

function WaiterSocket(socket: Socket) {
    const subs = new Subject<WaiterResponse>();

    let session: Session = null!;

    socket.on("waiterConnect", async (data: any) => {

        const { userId: uId, restaurantId: rId } = data;

        session = new Session(id(rId)!, id(uId)!);

        await Restaurant(rId).staff.online(uId);

        console.log("waiter connected");
    });

    socket.on("dish/served", async ({ orderDishId, orderId }: { orderId: string; orderDishId: string }) => {
        if(!session) {
            return;
        }

        session.served(orderId, orderDishId);
    });

    socket.on("disconnect", async () => {
        if(!session) {
            return;
        }
        
        const change = await Restaurant(session.restaurantId).staff.offline(session.userId);

        console.log("waiter disconnected: ", change.modifiedCount > 0);
    });

    return subs;
}

class Session {

    constructor(public restaurantId: ObjectId, public userId: ObjectId) { }

    async served(orderId: string, orderDishId: string) {
        const update1 = await Restaurant(this.restaurantId).waiter.remove(orderId, orderDishId);
        const update2 = await Stats(this.restaurantId).order(orderId).setWaiter(orderDishId, this.userId);

        console.log("dish served: ", update1.modifiedCount > 0);

        const order = await Restaurant(this.restaurantId).waiter.get(orderId);

        if(order?.dishes?.length == 0) {
            const update2 = await Restaurant(this.restaurantId).waiter.removeOrder(orderId);

            console.log("order removing: ", update2!.modifiedCount > 0);
        }
    }


}

async function convertDishes(restaurantId: string | ObjectId) {
    const convert = await Restaurant(restaurantId).waiter.getAll();

    const getIds = () => {
        const set = new Set<string>();
        for(let i of convert) {
            for(let j of i.dishes!) {
                set.add(j.dishId.toString());
            }
        }
        const result: ObjectId[] = []; for(let i of Array.from(set)) { result.push(id(i)!) };
        return result;
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: getIds() } }, { projection: { name: 1, image: 1 } });
    const table = new DishesHashTable(dishes);

    const result = [];

    for(let i of convert) {
        for(let j of i.dishes!) {
            if(j.show) {
                result.push({
                    _id: j._id,
                    dishId: j.dishId,
                    time: getDelay(j.time!),
                    table: i.table ? `Table: ${i.table}` : "Order",
                    orderId: i._id
                });
            }
        }
    }

    return { orderDishes: result, dishes: table.table };
}

export {
    WaiterSocket,
    convertDishes
}