import { ObjectId } from "mongodb";


type Id = ObjectId | string;


interface Component {
    name?: string;
    amount?: number; // grams
    price?: number;
    modified?: Date;
    _id?: ObjectId;
    used?: ObjectId[];
    history?: any[];
    warning?: number;
}
interface Cooking {
    recipee: string;
    components: { amount: number; _id: ObjectId; }[];
    cooks: ObjectId[];
    modified: { date: number; userId: ObjectId; };
}
interface RestaurantSettings {
    customers: {
        maxDishes: number;
        allowTakeAway: boolean;
        // trust: 1 | 2 | 3;
        maxCustomers: number;
        // maxPrice: "unlimited" | number;
        minPrice: number;
    },
    work: {
        // maxOrdersCooking: number;
    },
    dishes: {
        // strictIngredients: boolean;
        // types: 1 | 2;
    },
    payments: {

    }
}




interface Feedback {
    _id: ObjectId;
    worked: number;
    role: string;
    restaurantId: ObjectId;
    comment: string;
    rating: number;
}


namespace Settings {
    interface ManagerSettings {
        dishes: boolean;
        ingredients: boolean;
        staff: boolean;
        customers: boolean;
        settings: boolean;
        work: {
            cook: boolean;
            waiter: boolean;
        };
    }
    interface CookSettings {
    
    }
    interface WaiterSettings {
    
    }
}


interface Time {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
}

export {
    Settings,
    Id,
    Time,
    Cooking,
    Feedback,
    Component,
    RestaurantSettings
}