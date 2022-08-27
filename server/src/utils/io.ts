import { Socket } from "socket.io";
import { io } from "..";
import { Restaurant } from "./restaurant";
import { getUserPromise } from "./users";



function sendMessage(to: string[], event: "client" | "kitchen" | "waiter", data: any) {
    for(let i of to) {
        io.to(i).emit(event, data);
    }
}


function getUserIdCookie(cookies: string | string[]) {
    if(typeof cookies == "object") {
        return console.log(cookies);
    }
    if(!cookies) {
        return null;
    }

    const splitted = cookies.split(/\s*;\s*/);

    for(let i of splitted) {
        let pair = i.split(/\s*=\s*/);
        console.log(pair);
        if(pair[0] == "CTRABAUSERID") {
            return pair[1];
        }
        // output[pair[0]] = pair.splice(1).join('=');
    }
    return null;
}
function parseUrl(url: string) {
    if(!url) {
        return;
    }
    const splitted = url.split("/");
    const base = splitted[splitted.length - 3];
    if(base == "staff") {
        const joinTo = splitted[splitted.length - 1];
        const restaurantId = splitted[splitted.length - 2];
        if(!joinTo || !restaurantId) {
            return null;
        }
        return { joinTo, restaurantId };
    }
    return null;
}

function SocketIO(socket: Socket) {

    console.log("SOCKETID: ", socket.id);
    

    // const session: { restaurantId?: string; userId?: string; joinTo?: string; } = {};

    // const connect = async () => {
    //     console.log("connect() started");
    //     console.log(socket.request.headers);
    //     const result = parseUrl(socket.request.headers.referer!);
    //     if(!result) {
    //         console.log("NO URL INFO");
    //         return;
    //     }
    //     session.joinTo = result.joinTo;
    //     session.restaurantId = result.restaurantId;
    //     session.userId = getUserIdCookie(socket.request.headers.cookie!)!;
    //     if(!session.userId) {
    //         console.log("connect() ended with user id asking -", session.joinTo);
    //         return io.to(socket.id).emit(session.joinTo, { type: "userIdRequired" });
    //     }

    //     const restaurant = await Restaurant(session.restaurantId).get({ projection: { staff: 1 } });

    //     if(!restaurant) {
    //         return;
    //     }

    //     for(let i of restaurant.staff!) {
    //         if(i._id.equals(session.userId)) {
    //             console.log("CONNECTED");
    //             socket.join(`${session.restaurantId}/${session.joinTo}`);
    //             return;
    //         }
    //     }
        
    //     const user = await getUserPromise({ username: session.userId }, { projection: { _id: 1 } });
    //     if(!user) {
    //         return;
    //     }

    //     for(let i of restaurant.staff!) {
    //         if(i._id.equals(user._id!)) {
    //             console.log("CONNECTED");
    //             socket.join(`${session.restaurantId}/${session.joinTo}`);
    //             return;
    //         }
    //     }
    // }


    // connect();




    // socket.on("connectWithUserId", async ({ userId, joinTo, restaurantId }: { restaurantId: string; joinTo?: string; userId: string; }) => {
    //     console.log("CONNECTWITHUSERID");
    //     if(restaurantId != session.restaurantId || session.joinTo != joinTo) {
    //         console.log("DATA WAS WRONG");
    //     }

    //     const restaurant = await Restaurant(restaurantId).get({ projection: { staff: 1 } });

    //     if(!restaurant) {
    //         return;
    //     }

    //     for(let i of restaurant.staff!) {
    //         if(i._id.equals(userId)) {
    //             console.log("CONNECTED");
    //             socket.join(`${restaurantId}/${joinTo}`);
    //             return;
    //         }
    //     }
    // });


}


export {
    sendMessage,
    SocketIO
}