
type WaiterRequestReason = "cash" | "payment.error" | "other";

interface WaiterRequest {
    _id: string;
    reason: WaiterRequestReason;
    requested: any;
    sessionId: string;

    customer: {
        name: string;
        avatar: any;
        _id: string;
    }
}


export {
    WaiterRequest,
    WaiterRequestReason,
}