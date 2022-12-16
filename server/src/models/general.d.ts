import { LargeNumberLike } from "crypto";
import { ObjectId } from "mongodb";
import { Cooking, Order, Feedback, Invitation, Table, Id } from "./components";

interface Dish {
    _id: ObjectId;
    name?: string;
    price?: number;
    description?: string;
    categories?: string[];
    strict?: string[];
    general?: string;
    image?: { binary?: Buffer; modified: { userId: ObjectId; date?: number; }; resolution?: 1.33 | 1.77 | 1 };
    cooking?: Cooking;

    info: {
        liked?: number;
        time?: number;
        created?: { date: number, userId: ObjectId };
        modified?: { date: number, userId: ObjectId };
        bought?: number;
        rating?: number;
    };
    
    
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
    password?: string;
    _id: ObjectId;
    status: "enabled" | "deleted" | "restricted";
    online: number;
    avatar?: {
        binary: Buffer;
        modified: number;
    };
    anonymously?: boolean;
    feedbacks?: Feedback[];
    invitations?: Invitation[];
    restaurants: { restaurantId: ObjectId; stripeAccountId?: string; role: "manager" | "staff" | "owner" | "manager:working"; }[];
    orders?: { restaurantId: ObjectId; orderId: ObjectId; }[];
    created?: number;
    stripeCustomerId?: string;
    name?: {
        first: string;
        last: string;
    };
    info?: {
        location?: {
            country: string;
            city: string;
        }
        dob?: {
            year?: number;
            month?: number;
            day?: number;
        }
    }

    security?: {
        code?: string;
        codeToken?: string;
        codeConfirmed?: number;
        codeAsked?: number;
        tokenUpdated: number;
    }

    
}


export {
    Restaurant,
    Dish,
    User,
}