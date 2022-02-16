import { ObjectId } from "bson";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { db } from "./../environments/server";
import { client } from "../index";
import { Response, Restaurant, Work } from "../models/realtime";


function socket(socket: Socket) {
    const subs = new Subject<Response>();
    socket.on("realTimeConnect", async (data: { restaurant: string }) => {
        const { restaurant } = data;
        const result = await Promise.all([
            client.db(db).collection("restaurants")
                .findOne<Restaurant>({ _id: new ObjectId(restaurant) }, { projection: { workers: 1, sname: 1 } }),
            client.db(db).collection("work")
                .findOne<Work>({ restaurant: new ObjectId(restaurant) }, { projection: { kitchen: 1, waiter: 1, tables: 1 } })
        ]);
        subs.next({
            type: "connection",
            data: {
                restaurant: result[0],
                work: result[1]
            },
            send: [socket.id]
        });
    });
    return subs;
}


export {
    socket as RealTimeSocket
}