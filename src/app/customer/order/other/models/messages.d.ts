interface CustomerMessage {
    type: "payment/error" | "payment/failed" | "payment/succeeded" | "waiterRequest/quitted" | "dish/status" | "waiterRequest/accepted" | "waiterRequest/canceled";
    data: CustomerData.WaiterRequest | CustomerData.PaymentError | CustomerData.PaymentFailed | CustomerData.DishStatus;
}
namespace CustomerData {
    interface PaymentError {
        orderId: ObjectId,
        payed: boolean,
    };
    interface PaymentFailed {
        orderId: ObjectId | string;
        customerId: ObjectId | string;
        restaurantId: ObjectId | string;
    }
    interface DishStatus {
        _id: ObjectId;
        orderId: ObjectId;
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
    CustomerMessage,
    CustomerData,
}