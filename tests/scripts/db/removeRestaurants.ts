import { client } from "../index";

export async function restaurantCleaning(dbName: string, strict: boolean) {
    try {

        await client.connect();

        const restaurants = await client.db(dbName).collection("restaurants").find().toArray();

        for(let i of restaurants) {
            client.db(dbName).dropCollection(i._id.toString());
        }

        const result = await client.db(dbName).collection("restaurants").deleteMany({});
        const result2 = await client.db(dbName).collection("work").deleteMany({});

        console.log("RESTAURANTS CLEANING RESULT: ", result.deletedCount, result2.deletedCount);
    } catch (e) {
        if(strict) {
            console.log("RESTAURANTS CLEANING ERROR");
            throw e;
        } else {
            console.error("RESTAURANTS CLEANING ERROR:", e);
            console.log("RESTAURANTS CLEANING END  ----------------------------")
        }
    }
}