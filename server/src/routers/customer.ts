import e from "cors";
import { Router } from "express";
import { Timestamp } from "mongodb";
import { Locals } from "../models/other";
import { id } from "../utils/functions";
import { logged } from "../utils/middleware/logged";
import { manyRestaurants, Orders, Restaurant } from "../utils/restaurant";
import { HistoryRouter } from "./customer/history";
import { OrderRouter } from "./customer/order";



const router = Router();


router.use("/order/:restaurantId", OrderRouter);
router.use("/history", HistoryRouter);


router.get("/restaurants", async (req, res) => {
    
    const restaurants = await manyRestaurants({ status: "enabled" }, { projection: {
        name: 1,
        status: 1,
        _id: 1,
        settings: {
            money: { cash: 1, card: 1, },
        },
        info: {
            description: 1,
            time: 1,
            location: { line1: 1, line2: 1, city: 1, }
        }
    } });

    const result = [];

    for(let i of restaurants) {
        if(i.settings?.money?.card || i.settings?.money?.cash) {
            let payment;
            let time;
            let timeStatus;

            if(i.settings?.money.card == "enabled" && i.settings?.money.cash == "enabled") {
                payment = "all";
            } else if(i.settings?.money.card == "enabled") {
                payment = "card";
            } else {
                payment = "cash";
            }

            if(i.info?.time) {
                time = {
                    opens: {
                        ...i.info.time.opens,
                        minutes: i.info.time.opens.minutes.toString().length == 1 ? `0${i.info.time.opens.minutes}` : i.info.time.opens.minutes,
                    },
                    closes: {
                        ...i.info.time.closes,
                        minutes: i.info.time.closes.minutes.toString().length == 1 ? `0${i.info.time.closes.minutes}` : i.info.time.closes.minutes,
                    }
                }

                if(time.opens.half == "PM") {
                    time.opens.hours = time.opens.hours - 12;
                }
                if(time.closes.half == "PM") {
                    time.closes.hours = time.closes.hours - 12;
                }
                
                const date = new Date();
                if(date.getHours() < i.info.time.opens.hours || date.getHours() > i.info.time.closes.hours) {
                    timeStatus = "closed";
                } else if(date.getHours() == i.info.time.opens.hours) {
                    if(date.getMinutes() < i.info.time.opens.minutes) {
                        timeStatus = "closed";
                    } else {
                        timeStatus = "open";
                    }
                } else if(date.getHours() == i.info.time.closes.hours) {
                    if(date.getMinutes() > i.info.time.closes.minutes) {
                        timeStatus = "closed";
                    } else {
                        timeStatus = "open";
                    }
                } else {
                    timeStatus = "open";
                }
            }

            result.push({
                name: i.name,
                _id: i._id,
                location: i.info?.location,
                description: i.info?.description,
                payment,
                time,
                timeStatus
            });
        }
    }

    res.send(result);
});
router.get("/restaurant/:restaurantId/tables", async (req, res) => {
    const { restaurantId } = req.params;
    const { session } = req.query;

    const restaurant = await Restaurant(restaurantId).get({ projection: { tables: 1, settings: { customers: { allowTakeAway: 1 } } } });

    if(!restaurant) {
        return res.status(404).send({ reason: "restaurant" });
    }

    if(session != "no") {
        const order = await Orders(restaurantId).one({ customer: id(req.user as string) }).update({ $set: { connected: Date.now(), id: null! } });

        if(order) {
            return res.send({ session: true });
        }
    }


    const orders = await Orders(restaurantId).many({
        type: "dinein",
        $or: [
            { $and: [{ status: "ordering" }, { connected: { $gte: Date.now() - 300000 } } ] },
            { $and: [{ status: "progress" }] }
        ]
    }, { projection: { id: 1 } });

    const tables = [];

    for(let i = 0; i < restaurant.tables!; i++) {
        tables.push({ id: (i + 1).toString(), taken: false });
    }

    for(let i of orders) {
        if(i.id) {
            for(let t of tables) {
                if(t.id == i.id) {
                    t.taken = true;
                    break;
                }
            }
        }
    }


    const result = {
        showOrderButton: restaurant.settings?.customers!.allowTakeAway,
        tables,
    };

    res.send(result);
});
// router.post("/restaurant/:restaurantId/check", async (req, res) => {
//     const { restaurantId } = req.params;
//     const { table, type } = req.body;

//     if((!table && type == "in") || !type || !["in", "out"].includes(type)) {
//         return res.sendStatus(422);
//     }

//     const restaurant = await Restaurant(restaurantId).get({ projection: { tables: 1, blacklist: 1, settings: { customers: { allowDistanceOrders: 1 } } } });

//     if(!restaurant) {
//         return res.status(404).send({ reason: "restaurant" });
//     }

//     for(let i of restaurant!.blacklist!) {
//         if(i.equals(req.user as string)) {
//             return res.status(403).send({ reason: "blacklisted" });
//         }
//     }

//     if(table > restaurant.tables!) {
//         return res.status(403).send({ reason: "table" });
//     } else if(type == "out" && !restaurant.settings!.customers!.allowDistanceOrders) {
//         return res.status(403).send({ reason: "type" });
//     }

//     const orders = await Orders(restaurantId)
//         .many(
//             { type, id: table, connected: { $gte: Date.now() - 300000 } },
//             { projection: { customer: 1, connected: 1, } }
//         );

//     const result = {
//         other: orders.length > 0,
//     }



//     res.send(result);
// });
router.post("/restaurant/:restaurantId/create", logged({ _id: 1 }), async (req, res) => {
    const { restaurantId } = req.params;
    const { table, order, force } = req.body;
    const { user } = res.locals as Locals;

    if(typeof order != "boolean" || typeof force != "boolean") {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { blacklist: 1, settings: { customers: { allowTakeAway: 1 } }}})

    if(!restaurant) {
        return res.sendStatus(404);
    }

    if(order && !restaurant.settings!.customers.allowTakeAway) {
        return res.status(403).send({ reason: "settings" });
    }

    for(let i of restaurant.blacklist!) {
        if(typeof i != "string") {
            if(i.equals(user._id)) {
                return res.status(403).send({ reason: "blacklisted" });
            }
        }
    }


    if(order) {
        const result = await Orders(restaurantId).createSession({
            customer: id(user._id)!,
            connected: Date.now(),
            type: "takeaway",
            by: "customer",
            id: null!,
            dishes: [],
            socketId: null!,
            ip: req.ip,
            status: "ordering",
            _id: id()!,
        });

        return res.send({ updated: result });
    }

    if(table && typeof table != "number") {
        return res.sendStatus(422);
    }

    if(force) {
        const result = await Orders(restaurantId).createSession({
            customer: id(user._id)!,
            connected: Date.now(),
            type: "dinein",
            by: "customer",
            id: table?.toString(),
            dishes: [],
            socketId: null!,
            status: "ordering",
            _id: id()!,
        });

        return res.send({ updated: result });
    }

    if(table) {
        const orders = await Orders(restaurantId).many({ type: "dinein", id: table.toString(), customer: { $ne: id(user._id) }, connected: { $gte: Date.now() - 60000 * 5 } }, { projection: { _id: 1 } });
    
        if(orders.length > 0) {
            return res.send({ other: true });
        }
    }

    const result = await Orders(restaurantId).createSession({
        customer: id(user._id)!,
        connected: Date.now(),
        type: "dinein",
        by: "customer",
        id: table?.toString(),
        dishes: [],
        socketId: null!,
        status: "ordering",
        _id: id()!,
    });

    return res.send({ updated: result });
    
});



export {
    router as CustomerRouter,
}