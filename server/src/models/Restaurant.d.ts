import { ObjectId } from "mongodb";
import { Component, Invitation, RestaurantSettings } from "./components";
import { Worker } from "./worker";





// solo is for one device
// standart is for multiple devices
// disabled is for neither, used if restaurant wants statistics only
type RestaurantStaffMode = "solo" | "standart" | "disabled";


interface Restaurant {
    _id: ObjectId;
    staff?: Worker[];
    settings?: RestaurantSettings;


    blacklist?: (ObjectId | string)[];
    stripeAccountId?: string;
    status?: "verification" | "disabled" | "deleted" | "rejected" | "enabled";


    info?: {
        description?: string;
        name?: string;
        theme?: string;
        created?: number;
        owner?: ObjectId;
        tables?: number;

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
            };
        };
        location?: {
            country?: string;
            city?: string;
            state?: string;
            line1?: string;
            line2?: string;
            postal_code?: string;
        };
    };
    cache?: {
        customers?: {
            lastUpdate: number;
            data: any[];
        };
        requirements: string[];
    };
}


interface RestaurantSettings {
    customers: {
        allowOrderingOnline: boolean;
        maxDishes: number;
        allowDineIn: boolean;
        allowTakeOut: boolean;
        maxCustomers: number;
        minPrice: number;
    },
    dishes: {

    },
    staff: {
        mode: RestaurantStaffMode;
    }

    money?: {
        card: "enabled" | "disabled" | "rejected" | "restricted" | "pending";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "rejected" | "pending";
    }
}

export {
    Restaurant,
    RestaurantStaffMode,
    RestaurantSettings,
}