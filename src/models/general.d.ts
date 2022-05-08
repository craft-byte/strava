import { Component, RestaurantSettings, Table } from "./components";


interface Restaurant {
    _id: string;
    name?: string;
    owner?: string;
    tables?: Table[];
    staff?: Worker[];
    payments?: string[];
    components?: Component[];
    settings?: RestaurantSettings;
    tutorials?: {
        dishes: boolean;
        staff: boolean;
        cooking: boolean;
    }
}

export {
    Restaurant
}