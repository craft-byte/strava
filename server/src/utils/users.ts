import { Filter, FindOneAndUpdateOptions, FindOptions, ModifyResult, ObjectId, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { client } from "..";
import { mainDBName } from "../environments/server";
import { User } from "../models/general";
import { id } from "./functions";



async function user(filter: Filter<User>, options: FindOptions<User>): Promise<User | null> {
    try {
        return await client.db(mainDBName).collection<User>("users").findOne(filter, options);
    } catch (e) {
        console.error("at utils/user.ts user()");
        throw e;
    }
}

async function getUser(userId: string | ObjectId, options?: FindOptions<User>): Promise<User | null> {

    try {
        return (await client.db(mainDBName).collection("users").findOne<User>({ _id: id(userId), status: { $ne: "deleted" } }, options))!;
    } catch (e) {
        console.error(e);
        throw new Error("at getUser()")
    }
}

async function updateUser(userId: string | ObjectId, update: UpdateFilter<User>, options: FindOneAndUpdateOptions = { returnDocument: "after" }): Promise<{ ok: 1 | 0; user: User }> {

    try {
       const result = await client.db(mainDBName).collection<User>("users").findOneAndUpdate({ _id: id(userId) }, update, options);

       return { user: result.value!, ok: result.ok };
    } catch (e) {
        console.error("at updateUser()");
        throw e;
    }
}

async function addUser(newUser: User) {
    let result = null;

    try {
        result = await client.db(mainDBName).collection("users")
            .insertOne(newUser);
    } catch (e) {
        console.error(e);
        throw new Error("at addUser()");
    }

    return result;
}


export {
    updateUser,
    getUser,
    addUser,
    user,
}