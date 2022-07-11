import { ObjectId } from "mongodb";
import { Restaurant } from "./general";

interface Access {
    access: boolean;
}
interface PaymentDish { 
    dish: string; 
    quantity: number;
    answers: any;
}
interface OrderRemove {
    orderId: string;
}
interface WaiterNewDish {
    dish: SmallDish;
    orderId: string;
}
declare namespace Connection {
    interface ConnectionError {
        error: "password" | "user" | "restaurant" | "result";
    }
    interface Init {
        restaurant: string;
        sname: string;
        username: string;
    }
}
interface Notification {
    message?: string;
    type: "danger" | "warning" | "dish"
    dish?: string;
}
interface SmallDish {
    dishId: string;
    _id: ObjectId | string;
    taken?: string;
}
interface Message {
    text: string;
}
interface Error {
    error: string;
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
interface Connection {
    restaurant: Restaurant,
    connection: {
        taken: boolean;
        socketId: string;
        table: number;
    }
}
interface ForWaiter {
    show: string;
    isDone?: boolean;
    dishesLength?: number;
    _id: ObjectId | string;
    dishes: SmallDish[];
    toTime: Date;
    type: "order" | "table"
}
interface KitchenDish {
    dishId: ObjectId;
    time: { title: string; color: string; };
    type: Category;
    orderId: ObjectId;
    _id: ObjectId;
    comment?: string;
    taken?: boolean;
    takenTime: string;
}


export {
    Error,
    Access,
    Confirm,
    Message,
    SmallDish,
    ForWaiter,
    Connection,
    PaymentDish,
    OrderRemove,
    KitchenDish,
    Notification,
    WaiterNewDish,
}