import { ObjectId } from "bson";
import { RestaurantSettings } from "./radmin";
import { ForWaiter } from "./staff";

interface Restaurant {
    name: string;
    sname: string;
    _id?: string;
    categories: { name: string }[];
    payments: string[];
    settings: RestaurantSettings;
}
interface CustomerConnectData {
    restaurant: string;
    table: number;
    userId: string;
    user: string;
}

interface PaymentDish { 
    dish: string; 
    quantity: number;
    answers: any;
}

interface CustomerResponse {
    type: 
        "waiter/new" | 
        "connection/error" |
        "connection/success" | 
        "access" |
        "kitchen/new" | 
        "notification",
    // type: "newForWaiter" | "connection" | "access" | "init" | "confirm" | "connectionError" | "notification";
    data: PaymentDish[] | Access | Connection | { error: string; } | ForWaiter[] | { text: string } | Notification | Confirm[];
    send: string[];
    event?: "staffResponse";
}


interface Notification {
    message?: string;
    type: "warning" | "danger" | "dish";
    dish?: string;
}


interface Access {
    socketId: string;
    username: string;
}

interface Connection {
    restaurant: Restaurant,
    connection: {
        taken: boolean;
        socketId: string;
        table: number;
    }
}

interface SmallDish {
    _id: ObjectId | string;
    dishId: string;
    taken?: string;
}

interface AccessResponse {
    access: boolean;
    id: string;
}



interface Dish {
    name: string;
    image: string;
    price: string;
    time: string;
    categories: string[];
    _id: string;
    questions: Question[];
}

interface Question {
    name: string
    answer1: string;
    answer2: string;
    _id: string;
}

interface Confirm {
    user: string;
    type: "table" | "order"
    dishes: SmallDish[];
    _id: string | ObjectId;
    comment: string;
    toTime: Date;
    fromTime: Date;
    show: string;
}

interface Table {
    number: number;
    taken: boolean;
    users: TableUser[];
}

interface TableUser {
    userId: string;
    online: boolean;
    dishes: string[];
}
interface DishesNames {
    name: string;
    _id: string;
}
interface Custom extends Confirm {
    types?: { n: string; q: number }[];
}

export {
    Restaurant,
    TableUser,
    DishesNames,
    CustomerConnectData,
    CustomerResponse,
    Connection,
    Access,
    AccessResponse,
    Dish,
    Notification,
    SmallDish,
    Table,
    Confirm,
    PaymentDish,
    Custom
}