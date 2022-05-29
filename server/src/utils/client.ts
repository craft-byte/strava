import { ObjectId } from "mongodb";
import { Restaurant as RestaurantType } from "../models/general";
import { getDish } from "./dish";
import { Orders } from "./restaurant";

async function clientAllowed(
    restaurant: RestaurantType,
    userId: string,
    table: string
) {
    if(!table && !restaurant?.settings?.customers.orders) {
        return { access: false, info: "table" };
    }

    for(let i of restaurant.blackList || []) {
        if(i.toString() == userId) {
            return { access: false, info: "blacklist" };
        }
    }

    return { access: true };
}

async function createNotificationData(orderDishId: string, orderId: string, restaurantId: ObjectId) {
    const order = await Orders(restaurantId).one(orderId).get();

    if(!order) {
        return null;
    }

    for(let i of order.dishes!) {
        if(i._id.equals(orderDishId)) {
            const dish = await getDish(restaurantId, i.dishId, { projection: { name: 1 } });
            return { data: { msg: `${dish.name!} is ready!` }, send: [order.socketId!] }
        }
    }



    return null;
}


export {
    clientAllowed,
    createNotificationData
}