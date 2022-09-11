import { Router } from "express";
import { getDefaultSettings } from "http2";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { resourceLimits } from "worker_threads";
import { stripe } from "../..";
import { Time } from "../../models/components";
import { DishHashTableUltra } from "../../utils/dish";
import { id } from "../../utils/functions";
import { getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser } from "../../utils/users";

const router = Router({ mergeParams: true });


router.post("/check", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;

    const order = await Orders(restaurantId).one({ customer: id(req.user as string) }).update({ $set: { socketId, connected: Date.now() } }, { projection: { _id: 1 } });
    const restaurant = await Restaurant(restaurantId).get({ projection: { blacklist: 1, theme: 1, settings: { customers: { allowDistanceOrders: 1 } } } });

    if (!restaurant) {
        return res.sendStatus(404);
    }

    for (let i of restaurant.blacklist!) {
        if (i.equals(req.user as string)) {
            return res.sendStatus(403);
        }
    }

    if (order.order) {
        res.send({ theme: restaurant?.theme });
    } else {
        await Orders(restaurantId).createSession({
            customer: id(req.user as string)!,
            socketId: null!,
            type: "in",
            id: null!,
            dishes: [],
            status: "ordering",
            _id: id(),
        });

        res.send({ theme: restaurant.theme });
    }

});


interface InitResult {
    restaurant: {
        name: string;
        _id: string;
        theme: string;
    };
    order: {
        dishes: { name: string, price: number; quantity: number; _id: string; }[];
        dishesQuantity: number;
        type: string;
        id: string;
        comment: string;
    };
    showOut: boolean;
    showTracking: boolean;
}; router.post("/init", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { platform } = req.body;

    console.log(platform);

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, blacklist: 1, settings: { customers: { allowTakeAway: 1 } } } });

    if (!restaurant) {
        return res.status(404).send({ reason: "restaurant" });
    }

    const order = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { comment: 1, type: 1, id: 1, dishes: { dishId: 1 } } });

    if (!order) {
        return res.sendStatus(404);
    }

    const trackingOrders = await Orders(restaurantId).one({ customer: id(req.user as string), status: "progress" }).get({ projection: { _id :1 } });



    const getDishes = async () => {
        const dishesHash: any = {};

        for (let i of order.dishes) {
            if (dishesHash[i.dishId.toString()]) {
                dishesHash[i.dishId.toString()]++;
            } else {
                dishesHash[i.dishId.toString()] = 1;
            }
        }

        const ids = []; for (let i of Object.keys(dishesHash)) { ids.push(id(i)) }

        const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { name: 1, price: 1 } });

        const result: any = [];
        for (let i of dishes) {
            result.push({
                ...i,
                quantity: dishesHash[i._id.toString()],
            });
        }


        return result;
    }



    const result: InitResult = {
        restaurant: {
            name: restaurant.name!,
            _id: restaurantId,
            theme: restaurant.theme || "orange",
        },
        order: {
            dishes: await getDishes(),
            dishesQuantity: order.dishes.length,
            type: order.type,
            id: order.id,
            comment: order.comment || null!,
        },
        showOut: restaurant!.settings!.customers.allowTakeAway,
        showTracking: !!trackingOrders,
    };


    res.send(result);
});

router.get("/recommendations", async (req, res) => {
    const { restaurantId } = req.params as any;

    const getDishes = async () => {
        const convert = await Restaurant(restaurantId).dishes
            .many({})
            .get({
                limit: 7, projection: {
                    name: 1, price: 1, general: 1, time: 1,
                }
            });

        const result = [];

        for (let dish of convert) {
            result.push({
                name: dish.name!,
                price: dish.price!,
                category: dish.general!,
                _id: dish._id!,
                time: dish.time,
            });
        }

        return result;
    }


    res.send({ dishes: await getDishes() });
});
router.get("/dishes/:category", async (req, res) => {
    const { restaurantId, category } = req.params as any;

    console.log(category);

    if (!category || !["a", "so", "sa", "e", "si", "d", "b"].includes(category)) {
        return res.sendStatus(422);
    }



    const dishes = await Restaurant(restaurantId).dishes.many({ general: category }).get({ limit: 7, projection: { name: 1, time: 1, price: 1, general: 1, } });


    res.send(dishes);
});


router.get("/dish-image/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;


    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { image: { binary: 1, resolution: 1 } } });

    if (!dish) {
        return res.sendStatus(404);
    }

    res.send(dish.image);
});
router.get("/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({
        projection: {
            name: 1,
            time: 1,
            price: 1,
            description: 1,
            general: 1,
            image: { binary: 1, resolution: 1, }
        }
    });

    if (!dish) {
        return res.sendStatus(404);
    }

    const order = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { dishes: { dishId: 1 } } });

    if (!order) {
        return res.sendStatus(403);
    }

    let quantity = 0;

    for (let i of order.dishes!) {
        if (i.dishId.equals(dishId)) {
            quantity++;
        }
    }


    res.send({
        ...dish,
        category: dish.general,
        quantity
    })
});


router.post("/session/table", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { table, force } = req.body;

    if(!table) {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { tables: 1, } });

    if(!restaurant) {
        return res.status(404).send({ reason: "restaurant" });
    }

    if(table > restaurant.tables!) {
        return res.status(403).send({ reason: "table" });
    }

    console.log(req.body);

    if(!force) {
        const orders = await Orders(restaurantId).many({ type: "in", id: table.toString(), customer: { $ne: id(req.user as string) }, connected: { $gte: Date.now() - 60000 * 5 } }, { projection: { _id: 1 } });

        if(orders.length > 0) {
            console.log("CONFIRMED");
            return res.send({ confirm: true });
        }
    }

    console.log("FORCE FALSE AND UPDATE TRUE");


    const update = await Orders(restaurantId).one({ customer: id(req.user as string) }).update({ $set: { id: table.toString(), connected: Date.now() } });

    res.send({ updated: update.ok == 1 });

    Orders(restaurantId).update({ type: "in", customer: { $ne: id(req.user as string) }, id: table.toString(), status: "ordering" }, { $set: { id: null! }})
});
router.post("/session/type", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { type } = req.body;

    if (!type || !["in", "out"].includes(type)) {
        return res.sendStatus(422);
    }

    if (type == "out") {
        const oid = Math.floor(Math.random() * 1000).toString();
        const update = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).update({ $set: { type, id: oid } });

        return res.send({ updated: update.ok == 1, id: oid });
    }

    const update = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).update({ $set: { type, id: null! } });


    res.send({ updated: update.ok == 1 });
});
router.post("/session/comment", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { comment } = req.body;

    if(!comment || typeof comment != "string") {
        return res.sendStatus(422);
    }

    const update = await Orders(restaurantId).update({ customer: id(req.user as string), status: "ordering" }, { $set: { comment } });


    res.send({ updated: update.modifiedCount > 0 });
});
router.post("/session/dish", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { dishId, comment } = req.body;

    if (!dishId || dishId.length != 24) {
        return res.sendStatus(422);
    }

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1, } });

    if (!dish) {
        return res.sendStatus(404);
    }

    const update = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" })
        .update(
            {
                $push: {
                    dishes: {
                        dishId: id(dishId),
                        status: "ordered",
                        _id: id()!,
                        comment: comment || null,
                    }
                }
            }
        );


    res.send({ updated: update.ok == 1, dish });
});
router.get("/session/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const order = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { dishes: { dishId: 1, _id: 1, comment: 1, } } });

    if(!order) {
        return res.sendStatus(404);
    }

    const result = [];

    for(let i of order.dishes) {
        if(i.dishId.equals(dishId)) {
            result.push(i);
        }
    }


    res.send(result);
});
router.delete("/session/dish/:orderDishId", async (req, res) => {
    const { restaurantId, orderDishId } = req.params as any;

    const update = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).update({ $pull: { dishes: { _id: id(orderDishId) } } }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});
router.post("/session/dish/:orderDishId/comment", async (req, res) => {
    const { restaurantId, orderDishId } = req.params as any;
    const { comment } = req.body;

    if(!comment) {
        return res.sendStatus(422);
    }

    const update = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" })
        .update(
            { $set: { "dishes.$[dish].comment": comment } },
            { arrayFilters: [ { "dish._id": id(orderDishId) } ], projection: { _id: 1 } }
        );

    res.send({ updated: update.ok == 1 });
});



interface PaymentInfo {
    card: boolean;
    cash: boolean;
    total: number;
    subtotal: number;
    hst: number;
    type: "in" | "out";
    id: string | null;
    dishes: { name: string; price: number; amount: number; }[];
    clientSecret?: string;
    paymentIntentId?: string;
    methods: { last4: string; brand: string; id: string; }[];
    _id: ObjectId;
}; router.get("/session/payment-info", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1, stripeAccountId: 1, } });
    if(!restaurant) {
        return res.sendStatus(404);
    }
    
    const user = await getUser(req.user as string, { projection: { stripeCustomerId: 1 } });
    if(!user) {
        return res.sendStatus(403).send({ redirect: true });
    }

    const order = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { type: 1, id: 1, dishes: { dishId: 1 } }});
    if(!order) {
        return res.sendStatus(404);
    } else if(order.dishes.length == 0) {
        return res.status(403).send({ reason: "dishes" });
    }

    const result: PaymentInfo = {
        card: restaurant.money.card == "enabled",
        cash: restaurant.money.cash == "enabled",
        total: 0,
        subtotal: 0,
        hst: 0,
        type: order.type,
        id: order.id,
        dishes: [],
        methods: [],
        _id: order._id
    };


    const getIds = () => {
        const set = new Set<string>();
        for(let i of order.dishes) {
            set.add(i.dishId.toString());
        }
        const ids: ObjectId[] = [];
        for(let i of Array.from(set)) {
            ids.push(id(i)!);
        }
        return ids;
    };

    const ids = getIds();
    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { price: 1, name: 1 } });
    if(ids.length != dishes.length) {
        return res.status(500).send({ reason: "dishes" });
    }
    

    for(let i of order.dishes) {
        for(let j of dishes) {
            if(j._id.equals(i.dishId)) {
                result.subtotal += j.price!;
            }
        }
    }
    for(let dish of dishes) {
        let amount = 0;
        for(let { dishId } of order.dishes) {
            if(dishId.equals(dish._id)) {
                amount++;
            }
        }
        result.dishes.push({
            name: dish.name!,
            price: amount * dish.price!,
            amount,
        });
    }


    //
    //  in Ontario
    //  if order total  >  4 HST is 13%
    //  else HST is 5%
    //

    result.hst = Number((result.subtotal > 400 ? result.subtotal * 0.13 : result.subtotal * 0.05).toFixed(2));
    result.total = result.subtotal + result.hst;

    Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering", }).update({ $set: { money: { total: result.total, subtotal: result.subtotal, hst: result.hst } } });

    if(user.stripeCustomerId) {
        try {
            const paymentMethods = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: "card" });


            for(let i of paymentMethods.data) {
                if(i.card) {
                    result.methods.push({
                        last4: i.card.last4!,
                        brand: i.card.brand!,
                        id: i.id,
                    });
                }
            }

        } catch (e) {
            console.error("at /session/payment-info retrieving external accoutns");
            throw e;
        }
    }

    try {
        const p = await stripe.paymentIntents.create({
            amount: result.total,
            currency: "cad",
            setup_future_usage: "off_session",
            customer: user.stripeCustomerId,
            automatic_payment_methods: {
                enabled: true,
            },            
            metadata: {
                restaurantId: restaurantId,
                customerId: user._id!.toString(),
                orderId: order._id.toString(),
            },
            transfer_data: {
                destination: restaurant.stripeAccountId,
            },
            payment_method_options: {
                card: {
                    setup_future_usage: "off_session"
                }
            }
        });

        result.clientSecret = p.client_secret!;
        result.paymentIntentId = p.id;
    } catch (e: any) {
        console.log(e.type);
        if (e.type == "StripeInvalidRequestError") {
            const p = await stripe.paymentIntents.create(
                {
                    amount: result.total,
                    currency: "usd",
                    customer: user.stripeCustomerId,
                    transfer_data: {
                        destination: restaurant.stripeAccountId,
                    },
                    metadata: {
                        restaurantId: restaurantId,
                        customerId: user._id!.toString(),
                        orderId: order._id.toString(),
                    },
                },
            );

            result.clientSecret = p.client_secret!;
            result.paymentIntentId = p.id;
        } else {
            throw e;
        }
    }

    res.send(result);
});


router.post("/session/selected-card-confirm", async (req, res) => {
    const { paymentMethodId } = req.body;
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { stripeAccountId: 1 } });
    if(!restaurant) {
        return res.status(404).send({ reason: "restaurant" });
    }
    const user = await getUser(req.user as string, { projection: { stripeCustomerId: 1 } });
    if(!user) {
        return res.status(403).send({ redirect: true, reason: "user" });
    }
    if(!user.stripeCustomerId) {
        return res.status(403).send({ reason: "customer" });
    }
    const order = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { dishes: { dishId: 1, } } });
    if(!order) {
        return res.status(404).send({ reason: "order" });
    }


    const getIds = () => {
        const set = new Set<string>();
        for(let i of order.dishes) {
            set.add(i.dishId.toString());
        }
        const ids: ObjectId[] = [];
        for(let i of Array.from(set)) {
            ids.push(id(i)!);
        }
        return ids;
    };
    const ids = getIds();
    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { price: 1, name: 1 } });
    if(ids.length != dishes.length) {
        return res.status(500).send({ reason: "dishes" });
    }

    let subtotal = 0;
    let hst = 0;
    let total = 0;

    for(let i of order.dishes) {
        for(let j of dishes) {
            if(j._id.equals(i.dishId)) {
                subtotal += j.price!;
            }
        }
    }


    hst = Number((subtotal > 400 ? subtotal * 0.13 : subtotal * 0.05).toFixed(2));
    total = subtotal + hst;

    try {
        const result = await stripe.paymentIntents.create({
            customer: user.stripeCustomerId,
            payment_method: paymentMethodId,
            confirm: true,
            off_session: true,
            amount: total,
            currency: "CAD",
            metadata: {
                orderId: order._id.toString(),
                restaurantId,
                customer: req.user as string
            }
        });
    } catch (e) {
        throw e;
    }

    res.send({ created: true });
});



interface Tracking {
    dishes: { [dishId: string]: { name: string; image: any; _id: ObjectId; } };
    orders: {
        type: "Order" | "Table";
        id: string;
        _id: ObjectId;
        ordered: Time;
        dishes: {
            status: "ordered" | "cooking" | "cooked" | "served";
            dishId: ObjectId;
            _id: ObjectId;
        }[];
    }[];
}; router.get("/tracking", async (req, res) => {
    const { restaurantId } = req.params as any;


    const orders = await Orders(restaurantId).many({ customer: id(req.user as string), status: "progress" }, { projection: { dishes: 1, id: 1, type: 1, ordered: 1, } });

    const dishes = new DishHashTableUltra(restaurantId, { name: 1, image: { binary: 1 } });
    
    const o: Tracking['orders'] = [];
    const dishIds = new Set<string>();
    for(let order of orders) {
        for(let i of order.dishes) {
            dishIds.add(i.dishId.toString());
        }

        o.push({
            dishes: order.dishes as any,
            type: order.type == "in" ? "Table" : "Order",
            id: order.id,
            _id: order._id,
            ordered: getDelay(order.ordered!)
        });
    }

    const objectIds: ObjectId[] = [];

    for(let i of Array.from(dishIds)) {
        objectIds.push(id(i));
    }

    const dshs = await Restaurant(restaurantId).dishes.many({ _id: { $in: objectIds } }).get({ projection: { name: 1, image: { binary: 1 } } });

    dishes.add(dshs);


    const result = {
        dishes: dishes.table,
        orders: o,
    };


    res.send(result);
});



export {
    router as OrderRouter,
}