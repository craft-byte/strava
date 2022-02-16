import { Router } from "express";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { client } from "./../index";
import { ForWaiter, StaffResponse, TakeAndDone } from "../models/staff";
import { ObjectId } from "mongodb";
import { db } from "./../environments/server";
import { Confirm } from "../models/customer";
import { compare } from "./functions";


const router = Router();


router.patch("/names", async (req, res) => {
    const { ids } = req.body;


    if (!ids || ids.length == 0) {
        res.send([]);
        return;
    }

    const promises = [];

    for (let id of ids) {
        promises.push(
            client.db(db).collection("restaurants")
                .findOne<{ name: string; _id: string; sname: string }>({ _id: new ObjectId(id) }, { projection: { name: 1, sname: 1 } })
        );
    }

    const result = await Promise.all(promises);


    res.send(result);
});
router.get("/kitchenDish/:sname/:id", async (req, res) => {
    const { sname, id } = req.params;

    const result = await client.db(db).collection(sname)
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1, types: 1 } });

    res.send(result);
});
router.get("/image/:sname/:id", async (req, res) => {
    const { sname, id } = req.params;

    const result = await client.db(db).collection(sname)
        .findOne({ _id: new ObjectId(id) }, { projection: { image: 1 } });

    res.send(result);
});
router.get("/infoDish/:restaurant/:sname/:id", async (req, res) => {
    const { restaurant, id, sname } = req.params;

    const dish = await client.db(db).collection(sname)
        .findOne({ _id: new ObjectId(id) }, { projection: { image: 1, name: 1 } });

    const info = await client.db(db).collection("restaurants")
        .findOne({ restaurant });

    res.send({ ...dish, ...info });
});
router.get("/settings/:id", async (req, res) => {
    const { id } = req.params;

    if (!id || id.length !== 24) {
        res.send({ error: true });
        return;
    }

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: { settings: 1 } });

    res.send(result);
});


function socket(socket: Socket) {
    const subs = new Subject<StaffResponse>();

    let data: {
        restaurant: string;
        sname: string;
        user: string;
    } = { restaurant: null, sname: null, user: null };

    socket.on("login2", async ({ s, p }: { s: string; p: string }) => {


        if (!s || !p) {
            return;
        }

        const restaurant = await client.db(db).collection("restaurants")
            .findOne({ sname: s }, { projection: { staffPassword: 1, sname: 1, settings: { withNoAccount: 1 } } });

        if (!restaurant) {
            subs.next({
                type: "connection/error",
                data: { error: "restaurant" },
                send: [socket.id]
            });
            return;
        }

        if (!restaurant.settings.withNoAccount) {
            subs.next({
                type: "connection/error",
                data: { error: "restaurant" },
                send: [socket.id]
            });
            return;
        }

        if (!compare(p, restaurant.staffPassword)) {
            subs.next({
                type: "connection/error",
                data: { error: "password" },
                send: [socket.id]
            });
            return;
        }

        data.restaurant = restaurant._id;

        subs.next({
            send: [socket.id],
            data: {
                restaurant: restaurant._id,
                sname: restaurant.sname,
                username: ""
            },
            type: "connection/success"
        });
    });
    socket.on("login", async ({ restaurant, user }: { restaurant: string; user: string }) => {
        data.restaurant = restaurant;
        data.user = user;

        const found = await client.db(db).collection("restaurants")
            .findOne<{ sname: string; workers: { _id: string; }[] }>({ _id: new ObjectId(restaurant) }, { projection: { sname: 1, workers: 1 } });
        const foundUser = await client.db(db).collection("users")
            .findOne<{ username: string }>({ _id: new ObjectId(user) }, { projection: { username: 1 } });


        if (!found) {
            subs.next({
                send: [socket.id],
                data: { error: "restaurant" },
                type: "connection/error"
            });
            return;
        }

        const workers = []; for (let { _id } of found.workers) { workers.push(_id.toString()) };

        if (workers.indexOf(user) < 0) {
            subs.next({
                send: [socket.id],
                data: { error: "user" },
                type: "connection/error"
            });
            return;
        }


        subs.next({
            send: [socket.id],
            data: {
                restaurant,
                sname: found.sname,
                username: foundUser ? foundUser.username : null || "",
            },
            type: "connection/success"
        });
    });
    socket.on("staffConnect", async ({ type }: { type: "waiter" | "kitchen" }) => {
        socket.join(`${data.restaurant}/${type}`);

        if (type === "kitchen") {
            const found = await client.db(db).collection("work")
                .findOne<{ kitchen: Confirm[] }>({ restaurant: new ObjectId(data.restaurant) }, { projection: { kitchen: 1 } });
            if (!found) {
                socket.disconnect();
                console.log("no restaurant found");
                return;
            }
            subs.next({
                data: found.kitchen,
                type: "kitchen/init",
                send: [socket.id]
            });
        } else {
            const found = await client.db(db).collection("work")
                .findOne<{ waiter: ForWaiter[] }>(
                    {
                        restaurant: new ObjectId(data.restaurant)
                    }, { projection: { waiter: 1 } }
                );
            if (!found) {
                console.log("no restaurant found (waiter)");
                socket.disconnect();
                return;
            }
            subs.next({
                data: found.waiter,
                type: "waiter/init",
                send: [socket.id]
            });
        }
    });
    socket.on("kitchen/done", async ({ dishId, _id, orderId, types }: { user?: string; _id: string, dishId: string; orderId: string; types: string[] }) => {


        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                {
                    $pull: { "kitchen.$[s1].dishes": { _id: new ObjectId(_id) } },
                    $push: { "waiter.$[s1].dishes": { _id: new ObjectId(_id), dishId } },
                    $inc: { "waiter.$[s1].dishesLength": -1 }
                },
                { arrayFilters: [{ "s1._id": new ObjectId(orderId) }] }
            );


        subs.next({
            type: "kitchen/dish/done",
            data: { _id, orderId, types },
            send: [`${data.restaurant}/kitchen`],
            e: true
        });
        subs.next({
            type: "waiter/dish/new",
            data: { orderId, dish: { _id, dishId } },
            send: [`${data.restaurant}/waiter`]
        });


        sendNotification({ restaurant: data.restaurant, table: orderId, dish: dishId }, subs);
        workerStatistics(data.user, data.restaurant, dishId);
        kitchenStatistics({ _id, restaurant: data.restaurant, orderId });
        useComponents({ dishId, restaurant: data.restaurant });
    });
    socket.on("kitchen/dish/remove", ({ _id, orderId }: { _id: string; orderId: string }) => {
        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                { $pull: { "kitchen.$[s1].dishes": { _id: new ObjectId(_id) } } },
                { arrayFilters: [{ "s1._id": new ObjectId(orderId) }] }
            );
        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                { $inc: { "waiter.$[s1].dishesLength": -1 } },
                { arrayFilters: [{ "s1._id": new ObjectId(orderId) }] }
            )

        subs.next({
            type: "kitchen/dish/remove",
            data: { orderId, _id },
            send: [`${data.restaurant}/kitchen`]
        });
        subs.next({
            type: "waiter/dish/remove",
            data: { orderId },
            send: [`${data.restaurant}/waiter`]
        });
    });
    socket.on("kitchen/take", async ({ data: { orderId, _id }, is }: { data: TakeAndDone, is: boolean }) => {
        const user = await client.db(db).collection("users")
            .findOne({
                _id: new ObjectId(data.user)
            }, { projection: { username: 1 } });
        await client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                { $set: { "kitchen.$[s1].dishes.$[s2].taken": is ? user ? user.username : null : null } },
                { arrayFilters: [{ "s1._id": new ObjectId(orderId) }, { "s2._id": new ObjectId(_id) }] }
            );


        subs.next({
            send: [`${data.restaurant}/kitchen`],
            data: { orderId, _id, by: user ? user.username : null || data.user },
            type: is ? "kitchen/dish/take" : "kitchen/dish/untake"
        });
    });
    socket.on("kitchen/order/remove", async ({ orderId }: { orderId: string }) => {

        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                {
                    $pull: {
                        kitchen: { _id: new ObjectId(orderId) },
                        waiter: { _id: new ObjectId(orderId) }
                    }
                },
                { noResponse: true }
            );

        subs.next({
            type: "kitchen/order/remove",
            data: { orderId },
            send: [`${data.restaurant}/kitchen`]
        });
        subs.next({
            type: "waiter/order/remove",
            data: { orderId },
            send: [`${data.restaurant}/waiter`]
        });
    });
    socket.on("kitchen/order/fullDone", async ({ orderId }: { orderId: string }) => {
        await client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                {
                    $pull: {
                        kitchen: { _id: new ObjectId(orderId) }
                    }
                }
            );

        subs.next({
            type: "kitchen/order/remove",
            data: { orderId },
            send: [`${data.restaurant}/kitchen`]
        });
    });
    socket.on("waiter/done", async ({ orderId, _id }: TakeAndDone) => {

        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                { $pull: { "waiter.$[s1].dishes": { _id: new ObjectId(_id) } } },
                { noResponse: true, arrayFilters: [{ "s1._id": new ObjectId(orderId) }] }
            );


        subs.next({
            type: "waiter/dish/done",
            data: { orderId, _id },
            send: [`${data.restaurant}/waiter`]
        });
    });
    socket.on("waiter/order/done", async ({ orderId }: { orderId: string }) => {
        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(data.restaurant) },
                { $pull: { waiter: { _id: new ObjectId(orderId) } } },
                { noResponse: true }
            );

        subs.next({
            type: "waiter/order/done",
            data: { orderId },
            send: [`${data.restaurant}/waiter`]
        });
    });


    return subs;
}

export {
    router as StaffRouter,
    socket as StaffSocket
}

async function sendNotification({ restaurant, table, dish }: { dish: string; restaurant: string; table: string; }, subs: Subject<StaffResponse>) {
    const found = await client.db(db).collection("work")
        .aggregate<{ user: string }>([
            { $match: { restaurant: new ObjectId(restaurant) } },
            { $unwind: "$kitchen" },
            { $match: { "kitchen._id": new ObjectId(table) } },
            { $project: { user: "$kitchen.user" } }
        ]).toArray();


    if (!found || found.length == 0 || !found[0].user) {
        console.log("no user found");
        return;
    }

    subs.next({
        type: "notification",
        send: [found[0].user],
        data: { type: "dish", dish },
        event: "customerResponse"
    });
}
function workerStatistics(user: string, restaurant: string, dish: string) {
    client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            {
                $push: {
                    "workers.$[s1].cooked": { dishId: dish, date: new Date() }
                }
            }, { noResponse: true, arrayFilters: [{ "s1._id": new ObjectId(user) }] }
        );
}
function kitchenStatistics({ _id, orderId, restaurant }: { _id: string; orderId: string, restaurant: string; }) {

    client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            {
                $set: {
                    "orders.$[s1].dishes.$[s2].isDone": true
                }
            },
            { noResponse: true, arrayFilters: [{ "s1._id": new ObjectId(orderId) }, { "s2._id": new ObjectId(_id) }] }
        );

}
async function useComponents({ dishId, restaurant }: { dishId: string; restaurant: string }) {

    const fr = await client.db(db).collection('restaurants')
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { sname: 1 } });
    if (!fr || !fr.sname) {
        throw new Error("NO RESTAURANT SNAME USING COMPONENTS");
    }
    const fd = await client.db(db).collection(fr.sname)
        .findOne({ _id: new ObjectId(dishId) }, { projection: { cooking: 1 } });
    if (!fd || !fd.cooking) {
        console.log("NO DISH FOUND | COOKING");
        return;
    }

    const ps = [];

    for (let i of fd.cooking.components) {
        ps.push(
            client.db(db).collection("work")
                .updateOne(
                    { restaurant: new ObjectId(restaurant) },
                    { 
                        $inc: { "components.$[s1].value": -i.v },
                        $push: { "components.$[s1].used": { date: new Date(), value: i.v, for: dishId } } 
                    },
                    { arrayFilters: [{ "s1._id": new ObjectId(i.id) }] }
                )
        );
    }

}