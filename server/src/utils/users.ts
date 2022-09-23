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

function getUserPromise(search: Object, options?: Object): Promise<User | null> {
    return client.db(mainDBName).collection("users").findOne<User>(search, options);
}

async function getUsers(search: Filter<User>, options?: Object): Promise<User[]> {
    let result = null;

    try {
        result = await client.db(mainDBName).collection("users")
            .find<User>({ status: { $ne: "deleted" }, ...search }, options).toArray();
    } catch (e) {
        console.error(e);
        throw new Error("at getUsers()")
    }


    return result;
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

async function byUsername(username: string, options?: Object): Promise<User> {
    let result = null;

    try {
        result = await getUserPromise({ username, status: { $ne: "deleted" } }, options);
    } catch (e) {
        console.error(e);
        throw new Error("at byUsername()")
    }


    return result as User;
}

async function aggregateUser(pipeline: any[]) {
    try {
        return await client.db(mainDBName).collection("users")
            .aggregate(pipeline).toArray();
    } catch (e) {
        console.error(e);
        throw new Error("at aggregateUser()");
    }
}

async function getUserByEmail(email: string, options: FindOptions) {
    try {
        return await client.db(mainDBName).collection("users").findOne({ email, status: { $ne: "deleted" } }, options);
    } catch (e) {
        console.log("getting user by email");
        throw e;
    }
}


export {
    getUsers,
    updateUser,
    getUser,
    byUsername,
    addUser,
    getUserPromise,
    getUserByEmail,
    aggregateUser,
    user,
}