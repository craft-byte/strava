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
    name?: string;
    username?: string;
    email?: string;
    blacklisted?: ObjectId[];
    _id?: ObjectId;
    status: "enabled" | "deleted";
    avatar?: {
        binary: Buffer;
        modified: Date;
    };
    feedbacks?: Feedback[];
    invitations?: Invitation[];
    works?: ObjectId[];
    restaurants?: { restaurantId: ObjectId; stripeAccountId?: string; role: "manager" | "staff" | "owner" | "manager:working"; }[];
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
    status: "ordering" | "progress" | "done" | "removed" | "done:removed";
    customer: ObjectId;
    socketId: string;
    method?: "card" | "cash";
    type: "in" | "out";
    id: string;
    ordered?: number;
    connected?: number;

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