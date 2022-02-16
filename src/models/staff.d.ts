import { ObjectId } from "bson";
import { Confirm } from "./customer";





interface StaffResponse {
    type: 
        "connection/error" |
        "connection/success" |
        "kitchen/new" |
        "kitchen/init" |
        "notification" |
        "kitchen/dish/done" |
        "kitchen/dish/take" |
        "kitchen/dish/untake" |
        "kitchen/dish/remove" |
        "kitchen/order/remove" |
        "kitchen/answer/remove" |
        "waiter/new" |
        "waiter/init" |
        "waiter/dish/done" |
        "waiter/dish/new" |
        "waiter/dish/remove" |
        "waiter/order/done" |
        "waiter/order/remove",
    data: 
        Connection.ConnectionError |
        Connection.Init |
        Confirm[] |
        Notification |
        TakeAndDone |
        OrderRemove |
        ForWaiter[] |
        WaiterNewDish |

        Take;
    send: string[];
    event?: "customerResponse" | "loginResponse";
    e?: boolean;
}

interface TakeAndDone {
    _id: string;
    orderId: string;
    types?: string[];
}
interface OrderRemove {
    orderId: string;
}
interface Take extends TakeAndDone {
    by: string;
}
interface WaiterNewDish {
    dish: SmallDish;
    orderId: string;
}
interface InfoDish {
    name: string;
    image: string;
    _id: string;
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

declare namespace Init { 
    interface Connect {
        data: { restaurant: string; user: string; };
    }
    interface Resposnse {
        access: boolean;
        restaurant: string;
        sname: string;
    }
}



interface SmallDish {
    dishId: string;
    _id: ObjectId | string;
    taken?: string;
}


interface FullWaiterDish {
    name: string;
}

interface StaffUser {
    username: string;
    _id: string;
    works: string[]
    // coming soon...
}
interface OrderDone {
    _id: string;
}

interface DoneDataOrder {
    _id: string;
    dish: { _id: string; dishId: string };

}

interface DoneDataTable {
    _id: string;
    dish: { _id: string; dishId: string };
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

interface StatisticsDish { _id: string | ObjectId; dishId: string; isDone: boolean }

interface OrderStatistics {
    date: Date;
    dishes: StatisticsDish[];
    type: "order" | "table";
    _id: ObjectId | string;
}


export {
    OrderStatistics,
    Init,
    OrderDone,
    StatisticsDish,
    DoneDataTable,
    DoneDataOrder,
    StaffResponse,
    ForWaiter,
    StaffUser,
    Take,
    TakeAndDone,
    WaiterNewDish,
    FullWaiterDish,
    Connection,
    InfoDish,
    OrderRemove,
    SmallDish
}