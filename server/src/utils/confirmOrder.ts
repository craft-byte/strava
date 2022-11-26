import { ObjectId } from "mongodb";
import { Order } from "../models/general";
import { id } from "./functions";
import { sendMessage } from "./io";
import { getDelay } from "./other";
import { Orders, Restaurant } from "./restaurant";
import { updateUser } from "./users";



/**
 * 
 * orders are confirmed at:
 *      - src/routers/stripe.ts               used: confirmOrder
 *      - src/routers/staff/manualOrder.ts    used: updateDishes
 *      - src/routers/customers/order.ts      used: confirmOrder
 * 
 */



/**
 * 
 * - updates the order status
 * - increases bought property to the bought dishes
 * - sends data to kitchen
 * 
 * @param { string | ObjectId } restaurantId
 * @param { string | ObjectId } orderId
 * 
 */
async function confirmOrder(restaurantId: string | ObjectId, orderId: string | ObjectId, method: "card" | "cash") {
    

    // set order type to progress (cooking)
    const update = await Orders(restaurantId).one({ _id: id(orderId) })
        .update(
            { $set: {
                status: "progress",
                method,
                ordered: Date.now()
            } },
            {
                returnDocument: "after",
                projection: {
                    dishes: 1,
                    onBefalf: 1,
                    socketId: 1,
                    customer: 1,
                    ordered: 1,
                }
            }
        );


    await sendData(restaurantId, update.order);

    await updateDishes(restaurantId, update.order.dishes);

    
    if(update.order.customer) {
        await updateUserHistory(restaurantId, update.order);
    }
}


/**
 * 
 * converts data and sends to kitchen with socket.io
 * 
 * @param { string | ObjectId } restaurantId 
 * @param { Order } order 
 */
async function sendData(restaurantId: string | ObjectId, order: Order) {

    if(order.socketId) {
        // sends user to the tracking
        sendMessage([order.socketId], "customer", { orderId: order._id, payed: true, type: "payment.succeeded" });
    }


    const ids = new Set<string>();

    for (let i of order.dishes!) {
        ids.add(i.dishId.toString());
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).get({ projection: { general: 1, } });

    const forKitchen = [];
    const time = getDelay(order.ordered!);
    for (let i in order.dishes!) {
        for (let { general, _id } of dishes) {
            if (_id.equals(order.dishes[i].dishId)) {
                forKitchen.push({
                    orderId: order._id,
                    ...order.dishes![i],
                    time,
                    general: general
                });
            }
        }
    }


    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/order/new",
        event: "kitchen",
        data: forKitchen,
    });
}


/**
 * 
 * converts data and sends to kitchen with socket.io
 * 
 * @param { string | ObjectId } restaurantId 
 * @param { Order["dishes"] } dishes 
 */
async function updateDishes(restaurantId: string | ObjectId, dishes: Order["dishes"]) {
    
    const data: { [dishId: string]: number } = {};

    for(let i of dishes) {
        const dishId = i.dishId.toString();

        if(data[dishId]) {
            data[dishId]++;
        } else {
            data[dishId] = 1;
        }
    }
    
    for(let dishId of Object.keys(data)) {
        Restaurant(restaurantId).dishes.one(dishId).update({ $inc: { "info.bought": data[dishId] } });
    }
}


/**
 * 
 * adds order to the user's history
 * 
 * @param { string | ObjectId } restaurantId 
 * @param { Order } order 
 */
async function updateUserHistory(restaurantId: string | ObjectId, order: Order) {
    
    if(order.customer) {

        const update = await updateUser({ _id: id(order.customer) }, { $push: { orders: { restaurantId: id(restaurantId), orderId: id(order._id) } } });

    }

}




export {
    confirmOrder,
    updateDishes as updateDishesBought
}