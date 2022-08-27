import { ObjectId } from "mongodb";
import { stringify } from "querystring";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import {  WaiterResponse } from "../../../models/responses";
import { DishesHashTable } from "../../../utils/dish";
import { id } from "../../../utils/functions";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";

function WaiterSocket(socket: Socket) {
    // const subs = new Subject<WaiterResponse>();

    // let session: Session = null!;

    let restaurantId: string;

    socket.on("waiterConnect", async (data: any) => {

        const { userId: uId, restaurantId: rId } = data;

        // session = new Session(id(rId)!, id(uId)!);


        restaurantId = rId;


        await Restaurant(rId).staff.online(uId);

        console.log("waiter connected");
        socket.join(`${rId}/waiter`);
    });

    // socket.on("dish/served", async ({ orderDishId, orderId }: { orderId: string; orderDishId: string }) => {
    //     if(!session) {
    //         return;
    //     }

    //     session.served(orderId, orderDishId);
    // });

    socket.on("disconnect", async () => {
        if(!restaurantId) {
            return;
        }

        restaurantId = null!;
        
        // const change = await Restaurant(restaurantId).staff.offline(session.userId);

        // console.log("waiter disconnected: ", change.modifiedCount > 0);
    });

    // return subs;
}

// class Session {

//     constructor(public restaurantId: ObjectId, public userId: ObjectId) { }

//     async served(orderId: string, orderDishId: string) {
//         const update1 = await Restaurant(this.restaurantId).waiter.remove(orderId, orderDishId);
//         const update2 = await Stats(this.restaurantId).order(orderId).setWaiter(orderDishId, this.userId);

//         console.log("dish served: ", update1.modifiedCount > 0);

//         const order = await Restaurant(this.restaurantId).waiter.get(orderId);

//         if(order?.dishes?.length == 0) {
//             const update2 = await Restaurant(this.restaurantId).waiter.removeOrder(orderId);

//             console.log("order removing: ", update2!.modifiedCount > 0);
//         }
//     }


// }

async function convertDishes(restaurantId: string | ObjectId) {
    // const convert = await Restaurant(restaurantId).waiter.getAll();

    // const convert = await Orders(restaurantId).aggregate([
    //     { $match: { status: "progress" } },
    //     { $unwind: "$dishes" },
    //     { $match: { "dishes.status": "cooked" } },
    //     { $group: {
    //         _id: "$_id",
    //         dish: {
    //             $push: {
    //                 cooked: "$dishes.cooked",
    //                 _id: "$dishes._id",
    //                 dishId: "$dishes.dishId",
    //             }
    //         }
    //     } }
    // ]);

    const orders = await Orders(restaurantId).many({ status: "progress" }, { projection: { _id: 1, ordered: 1, dishes: { status: 1, dishId: 1, _id: 1 } } });
    console.log(orders);

    console.log("WAITER CONVERT DISHES CONVERTDISHES FUNCTION WAITER/FUNCTIONS.ts");

    const getIds = () => {
        const set = new Set<string>();
        for(let i of orders) {
            for(let j of i.dishes!) {
                set.add(j.dishId.toString());
            }
        }
        const result: ObjectId[] = [];
        for(let i of Array.from(set)) result.push(id(i)!);
        return result;
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: getIds() } }).get({ projection: { name: 1, image: 1 } });
    const table = new DishesHashTable(dishes);

    const result = [];

    for(let i of orders) {
        for(let j of i.dishes!) {
            console.log(j);
            if(j.status == "cooked") {
                result.push({
                    _id: j._id,
                    dishId: j.dishId,
                    time: getDelay(i.ordered!),
                    orderId: i._id
                });
            }
        }
    }

    console.log(result);

    return { orderDishes: result, dishes: table.table };
}

export {
    WaiterSocket,
    convertDishes
}