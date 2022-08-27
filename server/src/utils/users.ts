import { Filter, FindOptions, ObjectId, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { client } from "..";
import { mainDBName } from "../environments/server";
import { User } from "../models/general";
import { id } from "./functions";




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

async function updateUser(userId: string | ObjectId, update: UpdateFilter<User>, options?: UpdateOptions): Promise<UpdateResult> {

    let result = null;

    try {
        if(options) {
            result = await client.db(mainDBName).collection("users")
                .updateOne({ _id: id(userId) }, update, options);
        } else {
            result = await client.db(mainDBName).collection("users")
                .updateOne({ _id: id(userId) }, update);
        }
    } catch (e) {
        console.error(e);
        throw new Error("at updateUser()");
    }

    return result;
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


export {
    getUsers,
    updateUser,
    getUser,
    byUsername,
    addUser,
    getUserPromise,
    aggregateUser,
}