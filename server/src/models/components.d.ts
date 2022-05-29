import { ObjectId } from "mongodb";

interface Component {
    name?: string;
    amount?: number; // grams
    price?: number;
    modified?: Date;
    _id?: ObjectId;
    warning?: number;
}
interface Cooking {
    recipee: string;
    components: { amount: number; _id: ObjectId; }[];
    prefered: ObjectId[]
}
interface RestaurantSettings {
    customers: {
        orders: boolean;
        maxDishes: number;
        trust: 1 | 2 | 3;
    },
    work: {
        
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
    prefers: ObjectId[];
    joined: Date;
    settings: ManagerSettings | CookSettings | WaiterSettings
}
interface Payment { type: string };
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
    worked: number;
    role: string;
    restaurant: string;
    feedback: {
        comment: string;
        stars: number;
    }
}
interface Order {
    userId?: ObjectId;
    table?: number;
    dishes?: { _id: ObjectId; dishId: ObjectId; taken?: { userId: ObjectId; time: number; } }[];
    _id?: ObjectId;
    time?: Date;
    socketId?: string;
}
interface WaiterOrder {
    userId?: ObjectId;
    table?: number;
    dishes?: WaiterDish[];
    _id?: ObjectId;
    time?: number;
    socketId?: string;
}
interface StatisticsOrder {
    userId: ObjectId;
    table: number;
    dishes: { _id: ObjectId; dishId: ObjectId; status: number; cook?: ObjectId; waiter?: ObjectId }[];
    status: number;
    _id: ObjectId;
    time: Date;
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

export {
    ManagerSettings,
    CookSettings,
    WaiterSettings,
    WaiterOrder,
    Table,
    Worker,
    Payment,
    Order,
    Cooking,
    Feedback,
    Component,
    Invitation,
    StatisticsOrder,
    RestaurantSettings
}