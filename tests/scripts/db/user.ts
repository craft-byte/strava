import { FindOptions, ObjectId } from "mongodb";
import { client } from "..";
import { config } from "../../config";
import { removeRestaurant, updateRestaurant } from "./restaurant";


async function getUser(search: any, options: FindOptions) {
    try {
        return await client.db(config.dbName).collection("users")
            .findOne(search, options);
    } catch (e) {
        console.error("at getUser()");
        throw e;
    }
}
async function removeUser(id: any) {
    try {
        return await client.db(config.dbName).collection("users")
            .deleteOne({ _id: new ObjectId(id) });
    } catch (e) {
        console.error("at removeUser()");
        throw e;
    }
}


async function removeUserByUsername(username: string) {
    try {
        const user = await getUser({ username }, { projection: { restaurants: 1, works: 1 } });

        if(!user) {
            console.log("no user to remove");
            return;
        }

        for(let i of user!.restaurants) {
            await removeRestaurant(i);
        }
        for(let i of user!.works) {
            await updateRestaurant(i, { $pull: { works: { _id: new ObjectId() } } })
        }

        const result = await removeUser(user!._id);

        console.log("user removed:", result.deletedCount > 0);
    } catch (e) {
        console.error("at removeUserByUsername()");
        throw e;
    }
}


export {
    removeUserByUsername
}