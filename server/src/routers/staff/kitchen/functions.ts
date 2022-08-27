import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { Settings } from "../../../models/components";
import { KitchenResponse } from "../../../models/responses";
import { Restaurant } from "../../../utils/restaurant";

// class Session {

//     userId!: ObjectId;
//     restaurantId!: ObjectId;

//     constructor(userId: string, restaurantId: string) {
//         if (userId.length != 24 || restaurantId.length != 24) {
//             return;
//         }
//         this.userId = id(userId)!;
//         this.restaurantId = id(restaurantId)!;
//     }

//     async takeDish(orderId: string, orderDishId: string) {
//         const update1 = await Orders(this.restaurantId)
//             .one(orderId)
//             .update({
//                 $set: {
//                     "orders.$[order].dishes.$[dish].taken": {
//                         time: Date.now(),
//                         userId: this.userId
//                     }, 
//                     "statistics.$[order].dishes.$[dish].status": 2
//                 },
//             }, {
//                 arrayFilters: [ { "dish._id": id(orderDishId) } ],
//                 projection: { orders: 1 }
//             });

//         if (update1.ok > 0) {
//             log("success", "dish has been taken");
//         } else {
//             log("failed", "taking dish");
//         }

//         return update1.order.socketId;
//     }

//     async doneDish({ orderDishId, orderId, dishId }: { dishId: string; orderId: string, orderDishId: string }) {

//         const update1 = await Orders(this.restaurantId).one(orderId).update({
//             $pull: { "orders.$[order].dishes": { _id: id(orderDishId)! } },
//             $set: {
//                 "statistics.$[order].dishes.$[dish].status": 3,
//                 "statistics.$[order].dishes.$[dish].cook": this.userId,
//                 "statistics.$[order].dishes.$[dish].timeDone": Date.now(),
//             },
//         }, {
//             arrayFilters: [ { "dish._id": id(orderDishId) } ],
//             projection: { orders: 1, statistics: 1 }
//         });

//         const order = update1.order;

//         for(let i in order.dishes) {
//             if(order.dishes[+i] && order.dishes[+i]._id.equals(orderDishId)) {
//                 order.dishes.splice(+i, 1);
//                 break;
//             }
//         }

//         const update2 = await Orders(this.restaurantId).update(
//             { $set: {
//                 "waiter.$[order].dishes.$[dish].show": true,
//                 "waiter.$[order].dishes.$[dish].time": Date.now()
//             } },
//             { arrayFilters: [{ "order._id": id(orderId) }, { "dish._id": id(orderDishId) }] }
//         );
//         // .dishServe(orderId, orderDishId);

//         console.log("updating dish status + removing dish from order: ", update1.ok > 0);
//         console.log("adding dish to waiters: ", update2.modifiedCount > 0);

//         if(update1.ok == 0) {
//             log("error", "AT DONEDISH");
//             return null;
//         }

//         console.log("ORDER DISHES LENGTH", order.dishes);


//         if(order.dishes?.length == 0) {
//             const statsOrder = update1.statistics;
//             const status = await getOrderStatus(statsOrder, true);


//             const update3 = await Orders(this.restaurantId).one(orderId)
//                 .update({
//                     $set: { "statistics.$[order].status": status },
//                     $pull: { "orders": { _id: id(orderId) } }
//                 },
//                 { projection: { statistics: 1 } });
            
//             console.log("updating status + removing order: ", update3.ok > 0);

//             const update4 = await updateUser(
//                 order.userId!,
//                 { $push: { orders: {
//                     $each: [{
//                         ...update3.statistics,
//                         restaurantId: id(this.restaurantId)
//                     }],
//                     $position: 0
//                 } } }
//             );

//             console.log("user history added: ", update4.modifiedCount > 0);
//         }
        
//         const dish = await Restaurant(this.restaurantId).dishes.one(dishId).get({
//             projection: {
//                 name: 1,
//                 cooking: { components: 1 }
//             }
//         });

//         if(dish) {
//             if(dish?.cooking) {
//                 for(let i of dish?.cooking?.components!) {
//                     Restaurant(this.restaurantId).components.substract(i._id, i.amount);
//                 }
//             }
//             return { socketId: order.socketId, dishName: dish.name };
//         }

        
//         return { socketId: order.socketId, dishId };
//     }



// }


async function allowed(userId: string, restaurantId: string) {

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { role: 1, settings: 1, _id: 1 } } });

    for (let { role, userId: workerId, settings } of restaurant?.staff!) {
        if (workerId.toString() == userId) {
            if (role == "cook" || (role == "manager" && (settings as Settings.ManagerSettings).work.cook)) {
                return true;
            }
        }
    }

    return false;
}


function KitchenSocket(socket: Socket) {
    // const subs = new Subject<KitchenResponse>();

    // let session: Session;


    socket.on("kitchenConnect", ({ restaurantId, userId }: { restaurantId: string; userId: string; }) => {
        if (!allowed(userId, restaurantId)) {
            socket.disconnect();
            return null;
        }

        console.log('CONNTECTED KITCHEN');

        socket.join(`${restaurantId}/kitchen`);
    });

    // socket.on("kitchen/dish/take", async data => {
    //     if (!session) {
    //         return;
    //     }

    //     const { orderId, orderDishId } = data;

    //     const socketId = await session.takeDish(orderId, orderDishId);

    //     subs.next({
    //         type: "kitchen/dish/take",
    //         data: {
    //             orderDishId,
    //             orderId
    //         },
    //         send: [`${session.restaurantId.toString()}/kitchen`],
    //     });
    //     console.log(socketId);
    //     if (socketId) {
    //         subs.next({
    //             type: "customer/dish/status",
    //             event: "client",
    //             data: {
    //                 orderDishId,
    //                 orderId,
    //                 status: 2,
    //             },
    //             send: [socketId],
    //         });
    //     } else {
    //         throw "kitchen/dish/take error";
    //     }
    // });

    // socket.on("kitchen/dish/done", async data => {
    //     if(!session) {
    //         return;
    //     }

    //     const { orderDishId, orderId, dishId } = data;

    //     const result = await session.doneDish(data);

    //     subs.next({
    //         type: "kitchen/dish/done",
    //         data: {
    //             orderId,
    //             orderDishId
    //         },
    //         send: [`${session.restaurantId.toString()}/kitchen`],
    //     });
    //     subs.next({
    //         type: "waiter/dish/new",
    //         event: "waiter",
    //         data: {
    //             orderId,
    //             _id: orderDishId,
    //             time: { hours: 0, minutes: 0, nextMinute: 59900, color: 'green' },
    //             dishId,
    //         },
    //         send: [`${session.restaurantId.toString()}/waiter`],
    //     });

    //     if(result && result.socketId) {
    //         subs.next({
    //             type: "customer/dish/status",
    //             event: `client`,
    //             data: { dishName: result.dishName, orderId, orderDishId, status: 3 },
    //             send: [result.socketId!]
    //         });
    //     }
    // });

    socket.on("disconnect", () => {
        console.log("DISCONNECTED");
    });

    // return subs;
}

export {
    KitchenSocket,
}