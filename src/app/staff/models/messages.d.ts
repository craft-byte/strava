interface WaiterMessage {
    type: "dish/new" | "dish/served" | "request/removed" | "request/new" | "request/accepted";
    data: WaiterData.Dish | WaiterData.Request;
}
namespace WaiterData {
    interface Dish {
        dishId: string;
        _id: string;
        orderId: string;
        time: any;
        id: string;


        cooked?: {
            time: any;
        }
    };

    interface Request {
        reason: WaiterRequestReason;
        requestId: string;
    }
}







interface OrderDish {
    _id: string;
    dishId: string;
    comment?: string;
};
interface ParsedOrderDish extends OrderDish {
    time: any;
    orderId: string;
}



interface CookMessage {
    type: "order/new" | "dish/taken" | "dish/done" | "dish/quitted";
    data: CookData.Dish | CookData.OrderNew;
}
namespace CookData {
    interface Dish {
        dishId?: string;
        _id: string;
        orderId: string;

        taken?: {
            time: Time;
            user: {
                name: string;
                avatar: any;
                _id: string;
            }
        }
    };

    type OrderNew = ParsedOrderDish[];
}


export {
    CookMessage,
    CookData,
    WaiterData,
    WaiterMessage
}