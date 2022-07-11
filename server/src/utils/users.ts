import { ObjectId, UpdateResult } from "mongodb";
import { client } from "..";
import { db } from "../environments/server";
import { User } from "../models/general";
import { id } from "./functions";




function getUserPromise(search: Object, options?: Object): Promise<User | null> {
    return client.db(db).collection("users").findOne<User>(search, options);
}

async function getUsers(search: any, options?: Object): Promise<User[]> {
    let result = null;

    try {
        result = await client.db(db).collection("users")
            .find<User>(search, options).toArray();
    } catch (e) {
        console.error(e);
        throw new Error("at getUsers()")
    }


    return result;
}

async function getUser(userId: string | ObjectId, options?: Object): Promise<User> {
    let result = null;

    try {
        result = await getUserPromise({ _id: id(userId) }, options);
    } catch (e) {
        console.error(e);
        throw new Error("at getUser()")
    }


    return result as User;
}

async function updateUser(userId: string | ObjectId, update: any, options?: Object): Promise<UpdateResult> {

    let result = null;

    try {
        if(options) {
            result = await client.db(db).collection("users")
                .updateOne({ _id: id(userId) }, update, options);
        } else {
            result = await client.db(db).collection("users")
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
        result = await client.db(db).collection("users")
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
        result = await getUserPromise({ username }, options);
    } catch (e) {
        console.error(e);
        throw new Error("at byUsername()")
    }


    return result as User;
}

async function aggregateUser(pipeline: any[]) {
    try {
        return await client.db(db).collection("users")
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