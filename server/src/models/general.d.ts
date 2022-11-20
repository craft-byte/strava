import { LargeNumberLike } from "crypto";
import { ObjectId } from "mongodb";
import { Component, Cooking, Order, Feedback, Invitation, RestaurantSettings, Table, Id } from "./components";
import { Worker } from "./worker";

interface Restaurant {
    _id: ObjectId;
    name?: string;
    theme?: string;
    created?: Date;
    owner?: ObjectId;
    tables?: number;
    staff?: Worker[];
    settings?: RestaurantSettings;
    components?: Component[];
    invitations?: Invitation[];
    blacklist?: (ObjectId | string)[];
    stripeAccountId?: string;
    status?: "verification" | "disabled" | "deleted" | "rejected" | "enabled";
    
    info?: {
        description?: string;
        time: {
            opens: {
                hours: number;
                minutes: number;
                half: "AM" | "PM";
            };
            closes: {
                hours: number;
                minutes: number;
                half: "AM" | "PM";
            }
        }
        location?: {
            country?: string;
            city?: string;
            state?: string;
            line1?: string;
            line2?: string;
            postal_code?: string;
        }
    };
    cache?: {
        customers?: {
            lastUpdate: number;
            data: any[];
        };
        requirements: string[];
    }
}


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
    }

    
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
    }

}


interface Order {
    _id: ObjectId;
    
    customer: ObjectId | null;
    onBefalf?: ObjectId;
    
    by: "customer" | "staff";
    
    status: "ordering" | "progress" | "done" | "removed" | "done:removed";
    method?: "card" | "cash";

    type: "dinein" | "takeaway";
    id: string;

    mode: "solo" | "standart" | "disabled";
    
    ordered?: number;
    comment?: string;
    
    ip?: string;
    connected?: number;
    customerToken?: string;
    socketId: string;
    paymentIntentId?: string;

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
        id?: string;
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