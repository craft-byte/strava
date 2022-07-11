import { ObjectId } from "mongodb";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { ManagerSettings, StatisticsOrder } from "../../../models/components";
import { KitchenResponse } from "../../../models/responses";
import { createNotificationData } from "../../../utils/client";
import { id, log } from "../../../utils/functions";
import { Orders, Restaurant, Stats } from "../../../utils/restaurant";

class Session {

    userId!: ObjectId;
    restaurantId!: ObjectId;

    constructor(userId: string, restaurantId: string) {
        if (userId.length != 24 || restaurantId.length != 24) {
            return;
        }
        this.userId = id(userId)!;
        this.restaurantId = id(restaurantId)!;
    }

    async takeDish(orderId: string, orderDishId: string) {
        const update1 = await Orders(this.restaurantId).one(orderId).update({ $set: { "orders.$[order].dishes.$[dish].taken": { time: Date.now(), userId: this.userId } } }, { arrayFilters: [ { "dish._id": id(orderDishId) } ] })

        if (update1.modifiedCount > 0) {
            log("success", "dish has been taken");
        } else {
            log("failed", "taking dish");
        }

        return update1.modifiedCount > 0;
    }

    async doneDish({ orderDishId, orderId, dishId }: { dishId: string; orderId: string, orderDishId: string }) {
        const update1 = await Orders(this.restaurantId).one(orderId).update({ $pull: { "orders.$[order].dishes": { _id: id(orderDishId) } } });
        const update2 = await Stats(this.restaurantId).order(orderId).updateDishStatus(orderDishId, 2, this.userId);

        const order = await Orders(this.restaurantId).one(orderId).get();

        const update3 = await Restaurant(this.restaurantId).waiter.dishServe(orderId, orderDishId);

        console.log("removing dish from order: ", update1.modifiedCount > 0);
        console.log("updating dish status: ", update2.modifiedCount > 0);
        console.log("adding dish to waiters: ", update3.modifiedCount > 0);

        if(update1.modifiedCount == 0) {
            log("error", "AT DONEDISH");
            return null;
        }

        if(order.dishes?.length == 0) {
            const statsOrder = await Stats(this.restaurantId).order(orderId).get();
            const status = await getOrderStatus(statsOrder, true);


            const update4 = await Stats(this.restaurantId).order(orderId).updateStatus(status);
            const update5 = await Orders(this.restaurantId).one(orderId).remove();
            console.log("updating status: ", update4.modifiedCount > 0)
            console.log("removing order: ", update5.modifiedCount > 0);
        }
        
        const dish = await Restaurant(this.restaurantId).dishes.one(dishId).get({ projection: { cooking: { components: 1 } } });

        if(dish?.cooking) {
            for(let i of dish?.cooking?.components!) {
                Restaurant(this.restaurantId).components.substract(i._id, i.amount);
            }
        }


        return null;
    }



}

async function getOrderStatus(order: StatisticsOrder | null, done: boolean) {
    if(!order) {
        return 5;
    }

    let status = 2;

    for(let i of order.dishes!) {
        if(i.status > 2) {
            status = 2;
            if(done) {
                status = 32;
            }
        }
    }

    return status;
}
async function allowed(userId: string, restaurantId: string) {

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { role: 1, settings: 1, _id: 1 } } });

    for (let { role, _id, settings } of restaurant?.staff!) {
        if (_id.toString() == userId) {
            if (role == "cook" || (role == "manager" && (settings as ManagerSettings).work.cook)) {
                return true;
            }
        }
    }

    return false;
}

// function sortQuantity(dishes: string[]) {
//     const result = [] as { dishId: string; quantity: number }[];

//     for(let i of dishes) {
//         let add = true;
//         for(let j of result) {
//             if(i == j.dishId) {
//                 j.quantity++;
//                 add = false;
//                 break;
//             }
//         }
//         if(add) {
//             result.push({ dishId: i, quantity: 1 });
//         }
//     }

//     return {
//         result: result,
//         ids: (function() {
//             const ids: ObjectId[] = [];

//             for(let i of result) {
//                 ids.push(id(i.dishId)!);
//             }

//             return ids;
//         })()
//     };
// }


function KitchenSocket(socket: Socket) {
    const subs = new Subject<KitchenResponse>();

    let session: Session;


    // new dishes is in client socket


    socket.on("kitchenConnect", ({ restaurantId, userId }: { restaurantId: string; userId: string; }) => {
        if (!allowed(userId, restaurantId)) {
            socket.disconnect();
            return null;
        }

        session = new Session(userId, restaurantId);

        socket.join(`${restaurantId}/kitchen`);
    });

    socket.on("kitchen/dish/take", async data => {
        if (!session) {
            return;
        }

        const { orderId, orderDishId } = data;

        const result = await session.takeDish(orderId, orderDishId);

        if (result) {
            subs.next({
                type: "kitchen/dish/take",
                data: {
                    orderDishId,
                    orderId
                },
                send: [`${session.restaurantId.toString()}/restaurant`]
            });
        } else {
            throw "kitchen/dish/take error";
        }
    });

    socket.on("kitchen/dish/done", async data => {
        if(!session) {
            return;
        }

        const { orderDishId, orderId } = data;

        session.doneDish(data);

        const notification = await createNotificationData(orderDishId, orderId, session.restaurantId);

        if(notification) {
            subs.next({
                type: "customer/notification",
                event: "client",
                ...notification,
            });
        }
        subs.next({
            type: "kitchen/dish/done",
            data: {
                orderId,
                orderDishId
            },
            send: [`${session.restaurantId.toString()}/restaurant`],
        });
        // subs.next({
        //     type: "waiter/dish/new",
        //     event: "waiter",
        //     data: {

        //     },
        //     send: [`${session.restaurantId.toString()}/restaurant`]
        // });
    });

    socket.on("disconnect", () => {
        session = null!;
    });

    return subs;
}

export {
    KitchenSocket,
}