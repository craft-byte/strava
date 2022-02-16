import { Router } from "express";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { client } from "./../index";
import { Restaurant, Confirm, CustomerConnectData, CustomerResponse, Table, PaymentDish } from "../models/customer";
import { ObjectId } from "mongodb";
import { ForWaiter, SmallDish, OrderStatistics, StatisticsDish } from "../models/staff";
import { db } from "./../environments/server";


const router = Router();
const restaurantProjection = { name: 1, tables: 1, sname: 1, categories: { name: 1 }, owner: 1, payments: 1, settings: 1 };

router.get("/dishes/popular/:sname", async (req, res) => {
    const { sname } = req.params
    const result = await client.db(db).collection(sname)
        .find<{ _id: string }>({ choosen: true }, { projection: { _id: 1 }, limit: 7 }).toArray();

    let ids = [];
    for (let i of result) {
        ids.push(i._id);
    }

    res.send(ids);
});
router.get("/dishes/full/:restaurant/:id", async (req, res) => {
    const { restaurant, id } = req.params;

    const result = await client.db(db).collection(restaurant)
        .findOne(
            { _id: new ObjectId(id) },
            {
                projection: {
                    name: 1,
                    price: 1,
                    time: 1,
                    image: 1,
                    categories: 1,
                }
            }
        );

    res.send(result);
});
router.get("/dishes/description/:restaurant/:id", async (req, res) => {
    const { restaurant, id } = req.params;

    const result = await client.db(db).collection(restaurant)
        .findOne({ _id: new ObjectId(id) }, { projection: { description: 1 } });

    res.send(result);
});
router.get("/dishes/type/:restaurant/:type", async (req, res) => {
    const { restaurant, type } = req.params;

    const result = await client.db(db).collection(restaurant)
        .find<{ _id: string }>({ categories: type }, { projection: { _id: 1 } }).toArray();

    const ids = [];

    for (let i of result) {
        ids.push(i._id);
    }

    res.send(ids);
});
router.get("/dishes/small/:restaurant/:id", async (req, res) => {
    const { restaurant, id } = req.params;

    const result = await client.db(db).collection(restaurant)
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1, price: 1 } });

    if(!result) {
        res.send({ error: "notfound" });
        return;
    }

    res.send(result);
});
router.get("/init/:restaurant/:table/:socketId", async (req, res) => {
    const { socketId, table, restaurant } = req.params;

    const result = await client.db(db).collection("work")
        .aggregate([
            { $match: { restaurant: new ObjectId(restaurant) } },
            { $unwind: "$tables" },
            {
                $match: {
                    "tables.number": table,
                    "tables.userId": socketId
                }
            },
            { $project: { dishes: "$tables.dishes", confirmed: "$tables.confirmed" } }
        ]).toArray();


    res.send(result && result[0] ? result[0] : []);
});
router.patch("/like/:dish", (req, res) => {
    const { is, restaurant } = req.body;
    const { dish } = req.params;

    client.db(db).collection(restaurant)
        .updateOne({ _id: new ObjectId(dish) }, { $inc: { liked: is ? 1 : -1 } }, { noResponse: true });

    res.send({});
});
router.get("/dishName/:restaurant/:id", async (req, res) => {
    const { id, restaurant } = req.params;

    const result = await client.db(db).collection(restaurant)
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1 } });

    res.send(result);
});
router.get("/getRestaurant/:id", async (req, res) => {
    const { id } = req.params;

    if (id.length !== 24) {
        res.send({});
        return;
    }

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: restaurantProjection });

    if (!result) {
        res.send({});
        return;
    }

    res.send({ rest: result, tables: result.tables });
});
router.patch("/categoryImage/:restaurant", async (req, res) => {
    const { restaurant } = req.params;
    const { name } = req.body;

    const result = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: new ObjectId(restaurant) } },
            { $unwind: "$categories" },
            { $match: { "categories.name": name } },
            { $project: { image: "$categories.image" } }
        ]).toArray();

    if (!result || !result[0]) {
        res.send({ image: null });
    }

    res.send(result[0]);
});
router.patch("/byCategory/:restaurant", async (req, res) => {
    const { restaurant } = req.params;
    const { name } = req.body;
    const result = await client.db(db).collection(restaurant)
        .find<{ _id: string }>({ categories: name }, { projection: { _id: 1 } }).toArray();
    const ids = [];
    for (let i of result) {
        ids.push(i._id);
    }
    res.send(ids);
});
router.patch("/search", async (req, res) => {
    const { text, restaurant } = req.body;
    const names = await client.db(db).collection(restaurant)
        .find({}, { projection: { name: 1 } }).toArray();
    const found = []
    for(let i of names) {
      if(i.name.substring(0, text.length).toLowerCase() === text.toLowerCase()) {
        found.push(i._id);
      }
    }

    res.send(found);
});
router.get("/favorites/:sname", async (req, res) => {
    const { sname } = req.params;

    const found = await client.db(db).collection(sname)
        .find({ choosen: true }, { projection: { _id: 1 } }).toArray();

    const result = [];

    for(let {_id} of found) {
        result.push(_id.toString());
    }

    res.send(result);

});



function socket(socket: Socket) {
    const subs = new Subject<CustomerResponse>();

    let data: { 
        restaurant?: string;
        user?: string;
        table?: number;
    } = {};


    socket.on("customerConnect", async ({ restaurant, table, userId, user }: CustomerConnectData) => {

        data = { restaurant, table, user };


        const found = await client.db(db).collection("restaurants")
            .findOne<{ tables: Table[] }>({ _id: new ObjectId(restaurant) }, { projection: { tables: 1 } });


        if(!found) {
            subs.next({
                data: { error: "restaurant" },
                type: "connection/error",
                send: [socket.id]
            });
            return;
        }

        for(let t of found.tables) {
            if(t.number === table) {
                for(let u of t.users) {
                    if(u.userId === userId) {
                        const changes = {
                            "tables.$[s1].users.$[s2].userId": socket.id, 
                            "tables.$[s1].users.$[s2].online": true
                        }
                        if(user) {
                            changes["tables.$[s1].users.$[s2].user"] = user;
                        }
                        client.db(db).collection("restaurants")
                            .updateOne({ 
                                _id: new ObjectId(restaurant)
                            }, { $set: changes },
                            { noResponse: true, arrayFilters: [ { "s1.number": table }, { "s2.userId": userId } ] });
                        client.db(db).collection("work").updateOne({ restaurant: new ObjectId(restaurant) }, 
                            { $set: { 
                                "kitchen.$[s1].user": socket.id,
                                "waiter.$[s1].user": socket.id
                             } }, { arrayFilters: [{"s1.user": userId } ], noResponse: true });
                        subs.next({
                            data: {
                                restaurant: await client.db(db).collection("restaurants")
                                    .findOne<Restaurant>({ _id: new ObjectId(restaurant) }, { projection: restaurantProjection }),
                                connection: {
                                    socketId: socket.id,
                                    taken: true,
                                    table
                                }
                            }, type: "connection/success", send: [socket.id]
                        });
                        return;
                    }
                }
            }
        }


        client.db(db).collection("restaurants")
            .updateOne(
                { _id: new ObjectId(restaurant) }, 
                { 
                    $set: { "tables.$[s1].taken": true }, 
                    $push: { "tables.$[s1].users": { 
                        userId: socket.id, 
                        dishes: [], 
                        online: true, 
                        connected: new Date(),
                        user: user 
                    } } 
                }, 
                { arrayFilters: [ { "s1.number": table } ], noResponse: true }
            );

        subs.next({
            data: {
                restaurant: await client.db(db).collection("restaurants")
                    .findOne<Restaurant>({ _id: new ObjectId(restaurant) }, { projection: restaurantProjection }),
                connection: {
                    socketId: socket.id,
                    taken: false,
                    table
                }
            }, type: "connection/success", send: [socket.id]
        });
    });
    socket.on("confirm", async ({ dishes, comment, type, typeData }:
        { dishes: PaymentDish[]; comment: string; type: "order" | "table", typeData?: { time: Date; restaurant: string } }) => {

        const restaurant = data.restaurant || typeData.restaurant;
        const toTime = typeData.time || new Date();
        const fromTime = new Date();
        const _id = new ObjectId();
        const smallDishes = convertDishes(dishes);
        const show = data.table ? data.table.toString() : null || Date.now().toString().substring(0, 4);


        const newConfirm: Confirm = {
            type,
            _id,
            comment,
            dishes: smallDishes,
            show,
            fromTime,
            toTime,
            user: socket.id
        };
        const forWaiter: ForWaiter = {
            _id,
            dishes: [],
            dishesLength: smallDishes.length,
            isDone: false,
            show,
            toTime,
            type
        }

        client.db(db).collection("work")
            .updateOne(
                { restaurant: new ObjectId(restaurant) },
                { 
                    $push: {
                        waiter: forWaiter,
                        kitchen: newConfirm
                    }
                }
            );

        subs.next({
            type: "waiter/new",
            data: [forWaiter],
            send: [`${restaurant}/waiter`],
            event: "staffResponse"
        });
        subs.next({
            type: "kitchen/new",
            data: [newConfirm],
            send: [`${restaurant}/kitchen`],
            event: "staffResponse"
        });

        saveOrder({ restaurant, order: newConfirm });
        dishesBought(dishes, restaurant);
    });
    socket.on("disconnect", () => {
        client.db(db).collection("restaurants")
            .updateOne(
                { _id: new ObjectId(data.restaurant) }, 
                { $set: { "tables.$[s1].users.$[s2].online": false } }, 
                { noResponse: true, arrayFilters: [ {"s1.number": data.table }, { "s2.userId": socket.id } ] }
            );
    });
    return subs;

}

async function dishesBought(dishes: { quantity: number; dish: string }[], restaurant: string) {
    const found = await client.db(db).collection("restaurants")
        .findOne<{ sname: string }>({ _id: new ObjectId(restaurant) }, { projection: { sname: 1 } });

    if (!found) {
        console.log("something wrong with restaurant");
        return;
    }

    const date = new Date();

    for(let i of dishes) {
        client.db(db).collection(found.sname)
            .updateOne(
                { _id: new ObjectId(i.dish) }, 
                {
                    $inc: { bought: i.quantity },
                    $push: { dates: { date, quantity: i.quantity } }
                }
            );
    }
}
async function saveOrder({ restaurant, order }: { restaurant: string; order: Confirm }) {

    const dishes: StatisticsDish[] = [];

    for(let i of order.dishes) {
        dishes.push({ dishId: i.dishId, _id: i._id, isDone: false });
    }

    const converted: OrderStatistics = {
        dishes,
        date: order.fromTime,
        type: order.type,
        _id: order._id
    };

    client.db(db).collection("restaurants")
        .updateOne(
            {
                _id: new ObjectId(restaurant)
            },
            {
                $push: {
                    orders: converted
                }
            }
        );
}
function convertDishes(dishes: PaymentDish[]): SmallDish[] {
    const result: SmallDish[] = [];
    for(let i of dishes) {
        for(let j = 0; j < i.quantity; j++) {
            result.push({
                _id: new ObjectId(),
                dishId: i.dish
            });
        }
    }
    return result;
}


export {
    router as CustomerRouter,
    socket as CustomerSocket
}
