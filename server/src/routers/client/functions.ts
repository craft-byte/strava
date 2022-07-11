import { Id, Session } from "../../models/components";
import { Orders, Restaurant } from "../../utils/restaurant";

async function checkSession(restaurantId: Id, type: "order" | "table", number: number) {
    const result = {
        askToChange: false,
        hasToChange: false,
    };


    const orders = await Orders(restaurantId).aggregate([
        { $unwind: "$orders", },
        { $match: { "orders.type": type, "orders.number": number } },
        { $project: { _id: "orders._id" } },
    ]);

    if(orders[0]) {
        result.hasToChange = true;
        return result;
    }

    const sessions = await Restaurant(restaurantId).aggregate([
        { $unwind: "$sessions" },
        { $match: { "sessions.type": type, "sessions.number": number } },
        { $project: { session: "$sessions" } },
    ]);

    if(sessions[0]) {
        const session = (sessions[0] as any).session as Session;

        if((Date.now() - session.date.getTime()) > 600000 && session.dishes!.length == 0) { /// if date was created more than 6 minutes ago the sessions removes.
            removeSession(restaurantId, session._id);
            result.askToChange = false;
            return result;
        }

        result.askToChange = true;
    }
    return result;
}

async function removeSession(restaurantId: Id, sessionId: Id) {
    const result = await Restaurant(restaurantId).sessions.sessionId(sessionId).remove();

    console.log("session removed: ", result.modifiedCount > 0);
}

export {
    checkSession
}