import {
    Take,
    Error,
    Access,
    Confirm,
    Message,
    ForWaiter,
    Connection,
    PaymentDish,
    OrderRemove,
    TakeAndDone,
    Notification,
    WaiterNewDish,
} from "./other";

interface ClientResponse {
    type: 
        "access"
        | "kitchen/order/new"
        | "notification"
        | "connection/error"
        | "connection/success"
        | "customer/order/submited"
        | "customer/dish/error"
        | "customer/connection",
    data?: any;
    send: string[];
    event?: "kitchen" | "waiter";
}

// interface StaffResponse {
//     type: 
//         | "waiter/new"
//         | "waiter/init"
//         | "kitchen/new"
//         | "kitchen/init"
//         | "notification"
//         | "waiter/dish/new"
//         | "waiter/dish/done"
//         | "connection/error"
//         | "waiter/order/done"
//         | "kitchen/dish/done"
//         | "kitchen/dish/take"
//         | "waiter/dish/remove"
//         | "connection/success"
//         | "waiter/order/remove"
//         | "kitchen/dish/untake"
//         | "kitchen/dish/remove"
//         | "kitchen/order/remove"
//         | "kitchen/answer/remove",
//     data: 
//         Connection.ConnectionError |
//         Connection.Init |
//         Confirm[] |
//         Notification |
//         TakeAndDone |
//         OrderRemove |
//         ForWaiter[] |
//         WaiterNewDish |

//         Take;
//     send: string[];
//     event?: "customerResponse" | "loginResponse";
//     e?: boolean;
// }

interface KitchenResponse {
    type: 
        "kitchen/order/new" |
        "kitchen/order/done" |
        "kitchen/order/remove" |
        "kitchen/dish/remove" |
        "kitchen/dish/done" |
        "kitchen/dish/take" |
        "customer/dish/status" |
        "waiter/dish/new"
    ,
    send: string[];
    data: any;
    event?: string;
}
interface WaiterResponse {
    type: 
        "waiter/dish/new"
    ,
    send: string[];
    data: any;
    event?: string;
}




export {
    ClientResponse,
    // StaffResponse,
    KitchenResponse,
    WaiterResponse
}