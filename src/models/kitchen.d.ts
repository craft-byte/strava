import { Category } from "./components";

interface KitchenDish {
    name: string;
    image: string;
    dishId: string;
    time: { title: string; color: string; };
    type: Category;
    orderId: string;
    _id: string;
    taken?: boolean;
    takenTime?: string;
}

interface KitchenResponse {
    type: 
        "kitchen/order/new" |
        "kitchen/order/done" |
        "kitchen/dish/quitted" |
        "kitchen/order/remove" |
        "kitchen/dish/remove" |
        "kitchen/dish/done" |
        "kitchen/dish/take" |
        "userIdRequired"
    ,
    send: string[];
    data: KitchenDish[];
    event?: string;
}

interface Order {
    userId?: string;
    table?: number;
    dishes?: { _id: string; dishId: string; }[];
    time?: string;
    _id?: string;
}


export {
    KitchenDish,
    KitchenResponse,
    Order
}