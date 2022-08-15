import { ObjectId } from "mongodb";
import { Restaurant as RestaurantType } from "../models/general";
import { getDish } from "./dish";
import { Orders, Restaurant } from "./restaurant";

async function clientAllowed(
    restaurant: RestaurantType,
    userId: string,
    table: string
) {
    if(!table && !restaurant?.settings?.customers.allowDistanceOrders) {
        return { access: false, info: "table" };
    }

    for(let i of restaurant.blacklist || []) {
        if(i.toString() == userId) {
            return { access: false, info: "blacklist" };
        }
    }

    return { access: true };
}

export {
    clientAllowed,
}