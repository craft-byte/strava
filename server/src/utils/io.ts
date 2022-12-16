import { io } from "..";
import { CookData, CookMessage, CustomerData, CustomerMessage, WaiterData, WaiterMessage } from "../models/messages";



/**
 * @param { string[] } rooms - socket.id or socket.id[] or socket.room[] or both[]
 * @param { string } event - event "customer"(received by customer) and so on
 * @param { any } data - object that will be sent to receiver
 */
// export function sendMessage(rooms: string[], event: "customer" | "kitchen" | "waiter" | "other", data: any) {
//     io.to(rooms).emit(event, data);
// }





export function join(restaurantId: string, socketId: string) {
    io.in(socketId).socketsJoin(restaurantId);
}


// sentTo can be either restaurant id or a specific socketId
export function sendMessageToWaiter(sendTo: string, type: WaiterMessage["type"], data: WaiterMessage["data"]) {
    const message: WaiterMessage = {
        type,
        data
    };

    io.to(sendTo).emit("waiter", message);
}

// sentTo can be either restaurant id or a specific socketId
export function sendMessageToCook(sendTo: string, type: CookMessage["type"], data: CookMessage["data"]) {
    const message: CookMessage = {
        type,
        data
    };

    io.to(sendTo).emit("cook", message);
}

// sentTo can be either restaurant id or a specific socketId
export function sendMessageToCustomer(sendTo: string, type: CustomerMessage["type"], data: CustomerMessage["data"]) {
    io.to(sendTo).emit("customer", { type, data });
}