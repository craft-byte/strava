import { ObjectId, UpdateOptions } from "mongodb";
import { client } from "..";
import { config } from "../../config";


async function removeRestaurant(restaurantId: string | ObjectId) {
    try {
        const update1 = await client.db(config.dbName).collection("restaurants")
            .deleteOne({ _id: new ObjectId(restaurantId) });
        const update2 = await client.db(config.dbName).dropCollection(restaurantId.toString());
        const update3 = await client.db(config.dbName).collection("work").deleteOne({ restaurant: new ObjectId(restaurantId) });

        return { updated: update1.deletedCount > 0 && update2 && update3.deletedCount > 0 };
    } catch (e) {
        console.error("at removeRestaurant()");
        throw e;
    }
};
async function updateRestaurant(restaurantId: string | ObjectId, update: any, options: UpdateOptions = {}) {
    try {
        const result = await client.db(config.dbName).collection("restaurants")
            .updateOne({ _id: new ObjectId(restaurantId) }, update, options);

        return result;
    } catch (e) {
        console.error("at updateRestaurant()");
        throw e;
    }
}





export {
    updateRestaurant,
    removeRestaurant,
}