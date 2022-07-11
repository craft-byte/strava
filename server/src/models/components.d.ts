import { ObjectId } from "mongodb";


type Id = ObjectId | string;



interface Session {
    userId?: Id;
    _id: Id;
    dishes?: { _id: Id; dishId: Id; comment: string; }[];
    type?: "order" | "table";
    number?: number;
    date: Date;
}

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
    dishes?: { _id: ObjectId; dishId: ObjectId; comment?: string; taken?: { userId: ObjectId; time: number; } }[];
    _id?: ObjectId;
    time?: number;
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
    type: "order" | "table";
    number: number;
    dishes: { _id: ObjectId; dishId: ObjectId; status: number; cook?: ObjectId; waiter?: ObjectId }[];
    status: number;
    _id: ObjectId;
    time: number;
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

export {
    ManagerSettings,
    CookSettings,
    WaiterSettings,
    WaiterOrder,
    Table,
    Worker,
    Session,
    Id,
    Payment,
    Order,
    Cooking,
    Feedback,
    Component,
    Invitation,
    StatisticsOrder,
    RestaurantSettings
}