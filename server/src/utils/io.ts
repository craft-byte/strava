import { io } from "..";



function sendMessage(to: string[], event: "client" | "kitchen" | "waiter", data: any) {
    for(let i of to) {
        io.to(i).emit(event, data);
    }
}


export {
    sendMessage
}