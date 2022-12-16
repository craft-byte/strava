import { ObjectId } from "mongodb";
import { RestaurantStaffMode } from "./Restaurant";
import { OrderDish } from "./staff";



type OrderType = "dinein" | "takeout";
type OrderStatus = "ordering" | "progress" | "done" | "removed";

type DishStatus = "ordered" | "cooking" | "cooked" | "served" | "removed";

type WaiterRequestReason = "cash" | "payment.error" | "other";

interface OrderDish {
    _id: ObjectId;
    dishId: ObjectId;
    comment: string;
    id?: string;
    status: DishStatus;

    name?: string;
    price?: number;

    takenBy?: ObjectId;
    cook?: ObjectId;
    waiter?: ObjectId;

    taken?: number;
    cooked?: number;
    served?: number;

    removed?: {
        time: number;
        userId: ObjectId;
        reason: "components" | "other" | string;
    };
};


interface Order {
    _id: ObjectId;

    customer: ObjectId | null;
    onBehalf?: ObjectId;
    customerToken?: ObjectId | null;

    by: "customer" | "staff";

    status: OrderStatus;
    method?: "card" | "cash";

    type: OrderType;
    id: string;

    mode: RestaurantStaffMode;

    ordered?: number;
    comment?: string;

    ip?: string;
    connected?: number;
    socketId: string;
    paymentIntentId?: string;

    hasDishRemoved?: boolean;
    waiterRequests: {
        reason: WaiterRequestReason;
        active: boolean;
        _id: ObjectId;
        
        requestedTime: number;
        requestCanceledTime?: number;
        requestAcceptedTime?: number;
        requestResolvedTime?: number;
        
        waiter?: ObjectId;
    }[];

    money?: {
        hst: number;
        subtotal: number;
        total: number;
    };
    done?: {
        feedback?: {
            text?: string;
            rating?: number;
        };
    };

    removed?: {
        time: number;
        reason: string | "dishes";
        userId: ObjectId;
    };

    dishes: OrderDish[];
}



export {
    Order,
    OrderType,
    OrderStatus,
    DishStatus,
    WaiterRequestReason,
}