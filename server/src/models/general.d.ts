import { LargeNumberLike } from "crypto";
import { ObjectId } from "mongodb";
import { Component, Cooking, Order, Feedback, Invitation, RestaurantSettings, Table, Id } from "./components";
import { Worker } from "./worker";

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
    customersCache?: {
        lastUpdate: number;
        data: any[];
    };
    status?: "verification" | "disabled" | "deleted" | "rejected" | "enabled";
    money: {
        card: "enabled" | "disabled" | "rejected" | "restricted" | "pending";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "rejected" | "pending";
    }
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
    _id: ObjectId;
    cooking?: Cooking;
    bought?: number;

    
    /* 
        new

    replace bought?: { time: number; }[];

    add categories
    add categories.general
    add categories.cooking
    add categories.allergies
    add categories.time
    add categories.ingredients

    general: "entrees" | "beverages" | "sides" ...
    cooking: "baked" | "fried" ...
    allergies: "nuts" ...
    time: "breakfast" | "diner" | "after workout" ...
    ingredients: "caffeine" | "alcohol" | "meat" | "milk" ...


    add nutritionalValue
    add nutritionalValue.proteins
    add nutritionalValue.carbohydrates
    add nutritionalValue.minerals
    add nutritionalValue.vitamins
    
    */

}


interface User {
    email?: string;
    blacklisted?: ObjectId[];
    _id: ObjectId;
    status: "enabled" | "deleted" | "restricted";
    avatar?: {
        binary: Buffer;
        modified: number;
    };
    anonymously?: boolean;
    feedbacks?: Feedback[];
    invitations?: Invitation[];
    works?: ObjectId[];
    restaurants?: { restaurantId: ObjectId; stripeAccountId?: string; role: "manager" | "staff" | "owner" | "manager:working"; }[];
    password?: string;
    orders?: { restaurantId: ObjectId; orderId: ObjectId; }[];
    created?: number;
    stripeCustomerId?: string;
    name?: {
        first: string;
        last: string;
    };
    location?: {
        country: string;
        city: string;
    }
    dob?: {
        year?: number;
        month?: number;
        day?: number;
    }

    emailCode?: string;
    emailStored?: string;
}


interface Order {
    _id: ObjectId;
    status: "ordering" | "progress" | "done" | "removed" | "done:removed";
    customer: ObjectId;
    socketId: string;
    method?: "card" | "cash";
    type: "in" | "out";
    id: string;
    ordered?: number;
    connected?: number;
    comment?: string;

    money?: {
        hst: number;
        subtotal: number;
        total: number;
    }
    done?: {
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

        takenBy?: ObjectId;
        cook?: ObjectId;
        waiter?: ObjectId;

        taken?: number;
        cooked?: number;
        served?: number;
    
        removed?: {
            time: number;
            userId: ObjectId;
            userRole: "admin" | "cook" | "waiter" | "manager.cook" | "manager.waiter" | "manager" | null;
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