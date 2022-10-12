import { io } from "..";



/**
 * 
 * @param { string[] } to - socket.id or socket.id[] or socket.room[] or both[]
 * @param event - event "customer"(received by customer) and so on
 * @param data - object that will be sent to receiver
 */
export function sendMessage(to: string[], event: "customer" | "kitchen" | "waiter", data: any) {
    for(let i of to) {
        io.to(i).emit(event, data);
    }
}