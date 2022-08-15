import { Id } from "../../models/components";
import { id } from "../../utils/functions";
import { Orders, Restaurant } from "../../utils/restaurant";

async function checkSession(restaurantId: Id, type: "in" | "out", number: string, userId: Id) {
    const result = {
        askToChange: false,
        hasToChange: false,
    };


    // const orders = await Orders(restaurantId).aggregate([
    //     { $unwind: "$orders", },
    //     { $match: { "orders.type": type, "orders.number": number, "orders.userId": { $ne: id(userId) } } },
    //     { $project: { _id: "$orders._id", userId: "$orders.userId" } },
    // ]);

    const orders = await Orders(restaurantId).many({ type, number, status: "progress" }, { });

    if(orders && orders.length > 0) {
        result.hasToChange = true;
        return result;
    }

    // const sessions = await Restaurant(restaurantId).aggregate([
    //     { $unwind: "$sessions" },
    //     { $match: { "sessions.type": type, "sessions.number": number, "sessions.userId": { $ne: id(userId) } } },
    //     { $project: { session: "$sessions" } },
    // ]);

    const sessions = await Orders(restaurantId).many({ type, number, status: "ordering" });

    if(sessions && sessions.length > 0) {
        const session = (sessions[sessions.length - 1]);

        if((Date.now() - session.connected!) > 600000 && session.dishes!.length == 0) { /// if date was created more than 6 minutes ago the sessions removes.
            // removeSession(restaurantId, session._id);
            result.askToChange = false;
            return result;
        }

        result.askToChange = true;
    }
    return result;
}

// async function removeSession(restaurantId: Id, sessionId: Id) {
//     const result = await Restaurant(restaurantId).sessions.sessionId(sessionId).remove();

//     console.log("session removed: ", result.modifiedCount > 0);
// }

export {
    checkSession
}