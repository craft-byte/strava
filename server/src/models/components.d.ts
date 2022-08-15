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
    prefered: ObjectId[]
}
interface RestaurantSettings {
    customers: {
        maxDishes: number;
        allowDistanceOrders: boolean;
        trust: 1 | 2 | 3;
        maxCustomers: number;
        maxPrice: "unlimited" | number;
        minPrice: number;
    },
    work: {
        maxOrdersCooking: number;
    },
    dishes: {
        strictIngredients: boolean;
        types: 1 | 2;
    },
    payments: {

    }
}
interface Worker {
    _id: ObjectId;
    role: string;
    prefers?: ObjectId[];
    joined: Date;
    settings: ManagerSettings | CookSettings | WaiterSettings
}

interface Table {
    number: number;
    taken?: boolean;
    userId?: string;
    _id: string | ObjectId;
}
interface Invitation {
    _id: ObjectId;
    userId?: ObjectId;
    restaurantId?: ObjectId;
    role?: string;
    settings?: any;
    date: Date;
}
interface Feedback {
    _id: ObjectId;
    worked: number;
    role: string;
    restaurantId: ObjectId;
    comment: string;
    stars: number;
}
interface ManagerSettings {
    dishes: {
        add: boolean;
        remove: boolean;
        cooking: boolean;
    };
    work: {
        cook: boolean;
        waiter: boolean;
    };
    components: {
        add: boolean;
        remove: boolean;
    };
    staff: {
        hire: boolean;
        fire: boolean;
        settings: boolean;
        statistics: boolean;
    };
    customers: {
        blacklisting: boolean;
        statistics: boolean;
    };
    settings: boolean;
    restaurant: {
        theme: boolean;
        logo: boolean;
        name: boolean;
    };
}
interface CookSettings {

}
interface WaiterSettings {

}
interface WaiterDish {
    _id: ObjectId;
    dishId: ObjectId;
    show: boolean;
    time?: number;
}

interface Time {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
}

export {
    ManagerSettings,
    CookSettings,
    WaiterSettings,
    Table,
    Worker,
    Id,
    Time,
    Cooking,
    Feedback,
    Component,
    Invitation,
    RestaurantSettings
}