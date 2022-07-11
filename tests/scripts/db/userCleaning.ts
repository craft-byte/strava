import { client } from "../index";

export async function usersCleaning(dbName: string, strict: boolean) {
    try {

        await client.connect();

        const result = await client.db(dbName).collection("users").deleteMany({ });

        console.log("USER CLEANING RESULT: ", result);
    } catch (e) {
        if(strict) {
            console.log("USER CLEANING ERROR");
            throw e;
        } else {
            console.error("USER CLEANING ERROR:", e);
            console.log("USER CLEANING END  ----------------------------")
        }
    }
}