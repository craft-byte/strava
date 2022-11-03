import { Component, RestaurantSettings, Table } from "./components";


interface Restaurant {
    _id: ObjectId;
    name?: string;
    theme?: string;
    settings?: RestaurantSettings;
    status?: "verification" | "disabled" | "deleted" | "rejected" | "enabled";
}

export {
    Restaurant
}