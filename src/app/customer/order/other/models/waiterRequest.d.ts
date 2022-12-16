interface WaiterRequest {
    _id: string;
    accepted: boolean;
    canceled: boolean;
    reason: WaiterRequestReason;
    waiter: {
        name: string;
        avatar: any;
        _id: string;
    }
}

type WaiterRequestReason = "cash" | "payment.error" | "other";


export {
    WaiterRequest,
    WaiterRequestReason
}