import { ObjectId } from "mongodb";
import { Component, Cooking, Order, Feedback, Invitation, RestaurantSettings, Table, Worker, Id } from "./components";

interface Restaurant {
    _id: ObjectId;
    name?: string;
    theme: string;
    created: Date;
    owner?: ObjectId;
    tables?: number;
    staff?: Worker[];
    settings?: RestaurantSettings;
    components?: Component[];
    invitations?: Invitation[];
    blacklist?: ObjectId[];
    stripeAccountId: string;
    money: {
        card: "enabled" | "disabled" | "rejected" | "restricted" | "pending";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "rejected" | "pending";
    }
    status?: "verification" | "disabled" | "deleted" | "rejected" | "enabled";
    info?: {
        country?: string;
        city?: string;
        state?: string;
        line1?: string;
        line2?: string;
        postal_code?: string;
    }
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
    restaurants?: { restaurantId: ObjectId; stripeAccountId: string; }[];
    password?: string;
    phone?: string;
    orders?: any[];
    created?: Date;
    emailVerificationCode?: number;
    emailVerify?: string;
    stripeCustomerId?: string;
    fullName: {
        firstName: string;
        lastName: string;
    }
    info?: {
        country?: string;
        city?: string;
        year?: number;
        month?: number;
        day?: number;
        state?: string;
        line1?: string;
        line2?: string;
        postalCode?: string;
    }
}


interface Order {
    _id: ObjectId;
    status: "ordering" | "progress" | "done" | "removed";
    customer: ObjectId;
    socketId: string;
    method?: "card" | "cash";
    type: "in" | "out";
    id: string;
    ordered?: number;
    connected?: number;

    done?: {
        time: number;
        feedback?: {
            text?: string;
            rating?: number;
        };
    }
    removed?: {
        time: number;
        reason: string | "dishes";
        userId: ObjectId;
        userRole?: "owner" | "manager" | "admin" | null;
    };
    dishes: {
        _id: ObjectId;
        dishId: ObjectId;
        comment: string;
        status: "ordered" | "cooking" | "cooked" | "served" | "removed";

        name?: string;
        price?: number;

    
        cook?: ObjectId;
        waiter?: ObjectId;

        taken?: number;
        cooked?: number;
        served?: number;
    
        removed?: {
            time: number;
            userId: ObjectId;
            userRole: "admin" | "cook" | "waiter" | "manager.cook" | "manager.waiter" | "manager" | "admin";
            reason: "components" | "other" | string;
        }
    }[];
}



export {
    Restaurant,
    Dish,
    User,
    Order,
}