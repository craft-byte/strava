import { WaiterRequestReason } from "./Order";
import { ParsedOrderDish } from "./staff";
import { DishStatus as RestaurantDishStatus } from "./Order";
import { ObjectId } from "mongodb";



interface WaiterMessage {
    type: "dish/new" | "dish/served" | "request/removed" | "request/new";
    data: WaiterData.Dish | WaiterData.Request;
}
namespace WaiterData {
    interface Dish {
        dishId: string | ObjectId;
        _id: string | ObjectId;
        orderId: string | ObjectId;
        time?: Time;
        id?: string;

        

        cooked?: {
            time: Time;
        }
    };

    interface Request {
        reason?: WaiterRequestReason;
        requestId: string | ObjectId;
    }
}

interface CookMessage {
    type: "order/new" | "dish/taken" | "dish/done" | "dish/quitted";
    data: CookData.Dish | CookData.OrderNew;
}
namespace CookData {
    interface Dish {
        dishId?: string | ObjectId;
        _id: string | ObjectId;
        orderId: string | ObjectId;

        taken?: {
            time: Time;
            user: {
                name: string;
                avatar: any;
                _id: string | ObjectId;
            }
        }
    };

    type OrderNew = ParsedOrderDish[];
}


interface CustomerMessage {
    type: "payment/error" | "payment/failed" | "payment/succeeded" | "dish/status" | "waiterRequest/canceled" | "waiterRequest/accepted" | "waiterRequest/quitted";
    data: CustomerData.WaiterRequest | CustomerData.PaymentError | CustomerData.PaymentFailed | CustomerData.DishStatus;
}
namespace CustomerData {
    interface PaymentError {
        orderId: string | ObjectId,
        payed: boolean,
    };
    interface PaymentFailed {
        orderId: string | ObjectId;
        customerId: string | ObjectId;
        restaurantId: string | ObjectId;
    }
    interface DishStatus {
        _id: string | ObjectId;
        orderId: string | ObjectId;
        status: RestaurantDishStatus;
    }
    interface WaiterRequest {
        requestId: string | ObjectId;

        waiter?: {
            name: string;
            avatar: any;
            _id: string | ObjectId;
        }
    }
}

export {
    WaiterData,
    WaiterMessage,
    CookMessage,
    CookData,
    CustomerMessage,
    CustomerData,
}