import { ObjectId } from "mongodb";
import { Order } from "../models/Order";
import { id } from "./functions";
import { getDelay } from "./other";
import { Restaurant } from "./restaurant";
import { Orders } from "./orders";
import { updateUser } from "./users";
import { sendMessageToCook, sendMessageToCustomer } from "./io";
import { ParsedOrderDish } from "../models/staff";



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
        sendMessageToCustomer(order.socketId, "payment/succeeded", { orderId: order._id, payed: true });
    }


    const forKitchen: ParsedOrderDish[] = [];
    const time = getDelay(order.ordered!);
    for (let i in order.dishes!) {
        forKitchen.push({
            orderId: order._id,
            ...order.dishes![i],
            time,
        });
    }


    sendMessageToCook(restaurantId.toString(), "order/new", forKitchen);
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