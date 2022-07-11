import { ObjectId } from "mongodb";
import { Component, Cooking, Order, Feedback, Invitation, Payment, RestaurantSettings, Table, Worker, Session } from "./components";

interface Restaurant {
    _id: ObjectId;
    name?: string;
    created: Date;
    owner?: ObjectId;
    tables?: Table[];
    staff?: Worker[];
    settings?: RestaurantSettings;
    payments?: Payment[];
    components?: Component[];
    invitations?: Invitation[];
    blacklist?: ObjectId[];
    sessions?: Session[];
}

interface Work {
    orders?: Order[];
    restaurant?: ObjectId;
}

interface Dish {
    name?: string;
    price?: number;
    time?: number;
    created?: { date: Date, user: ObjectId };
    modified?: { date: Date, user: ObjectId };
    description?: string;
    categories?: string[];
    strict?: string[];
    general?: string;
    image?: { binary?: Buffer; date?: Date; resolution?: 1.33 | 1.77 | 1 };
    bought?: number;
    _id: ObjectId;
    cooking?: Cooking;
}


interface User {
    name?: string;
    username?: string;
    email?: string;
    blacklisted?: ObjectId[];
    _id?: ObjectId;
    works?: ObjectId[];
    avatar?: {
        binary: Buffer;
        modified: Date;
    };
    feedbacks?: Feedback[];
    invitations?: Invitation[];
    works?: ObjectId[];
    restaurants?: ObjectId[];
    password?: string;
    phone?: string;
    created?: Date;
    emailVerificationCode?: string;
    emailVerify?: string;
}

export {
    Restaurant,
    Dish,
    User,
    Work
}