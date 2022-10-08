import e from "cors";
import { Router } from "express";
import { stat } from "fs";
import { Filter, ObjectId } from "mongodb";
import { isPromise } from "util/types";
import { stripe } from "../..";
import { order } from "../../middleware/user";
import { Time } from "../../models/components";
import { Order, User } from "../../models/general";
import { DishHashTableUltra } from "../../utils/dish";
import { id } from "../../utils/functions";
import { passOrder } from "../../utils/middleware/customerAllowed";
import { passUserId } from "../../utils/middleware/logged";
import { getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser } from "../../utils/users";

const router = Router({ mergeParams: true });

interface LocalLocals {
    status: "loggedin" | "loggedout" | "noinfo";
    userId: string | null;
    order: Order;
}


/**
 * 
 * @param { string } restaurantId
 * @param { string } socketId
 * @param { string } userId
 * @param { loggedin | loggedout | noinfo } status
 * 
 */
router.post("/check", passUserId, async (req, res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;
    const { userId, status } = res.locals as LocalLocals;

    console.log(userId, status);


    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!) };
    } else {
        filter = { ip: req.ip };
    }
    const update = await Orders(restaurantId).update(filter, { $set: { socketId, connected: Date.now() } });

    if(update.matchedCount > 0 && update.modifiedCount > 0) {
        const order = await Orders(restaurantId).createSession({
            customer: userId ? id(userId!) : null,
            status: "ordering",
            _id: id()!,
            dishes: [],
            id: null!,
            type: "in",
            socketId,
            ip: req.ip,
        });
    }
    
    
    res.send({ status });
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
};
/**
 * @param { any } platform
 * 
 * returns dishes, order data, restaurant data.
 * 
*/
router.post("/init", passUserId, async (req, res) => {
    const { restaurantId } = req.params as any;
    const { platform } = req.body;
    const { status, userId } = res.locals as LocalLocals;

    console.log(platform);

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, blacklist: 1, theme: 1, settings: { customers: { allowTakeAway: 1 } } } });

    if (!restaurant) {
        return res.status(404).send({ reason: "RestaurantNotFound" });
    }
    
    if(restaurant.blacklist) {
        for(let i of restaurant.blacklist) {
            if(typeof i == "string") {
                if(i == req.ip) {
                    return res.status(403).send({ reason: "Blacklisted" });
                }
            } else if(i.equals(userId!)) {
                return res.status(403).send({ reason: "Blacklisted" });
            }
        }
    }

    let order: Order;
    let trackingOrders: Order;

    if(status == "loggedin" || status == "loggedout") {
        order = await Orders(restaurantId).one({ customer: id(userId as string), status: "ordering" }).get({ projection: { comment: 1, type: 1, id: 1, dishes: { dishId: 1 } } });
        trackingOrders = await Orders(restaurantId).one({ customer: id(userId as string), status: "progress" }).get({ projection: { _id: 1 } });
    } else {
        order = await Orders(restaurantId).one({ ip: req.ip, status: "ordering" }).get({ projection: { comment: 1, type: 1, id: 1, dishes: { dishId: 1 } } });
        trackingOrders = await Orders(restaurantId).one({ ip: req.ip, status: "progress" }).get({ projection: { _id: 1 } });
    }

    if (!order) {
        return res.sendStatus(404);
    }



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
                    name: 1, price: 1, general: 1, info: {time: 1},
                }
            });

        const result = [];

        for (let dish of convert) {
            result.push({
                name: dish.name!,
                price: dish.price!,
                category: dish.general!,
                _id: dish._id!,
                time: dish.info.time,
            });
        }

        return result;
    }


    res.send({ dishes: await getDishes() });
});
router.get("/dishes/:category", async (req, res) => {
    const { restaurantId, category } = req.params as any;

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
router.get("/dish/:dishId", passUserId, passOrder({ dishes: { dishId: 1, } }), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;
    const { order } = res.locals;

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({
        projection: {
            name: 1,
            price: 1,
            description: 1,
            general: 1,
            info: { time: 1, },
            image: { binary: 1, resolution: 1, }
        }
    });
    const restaurant = await Restaurant(restaurantId).get({ projection: { theme: 1 } });

    if (!dish) {
        return res.sendStatus(404);
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
        quantity,
        theme: restaurant?.theme
    })
});


/**
 * 
 * FRONTEND ERROR HANDLING
 * 
 * changes order table
 * 
 * @param { number } table - scanned or selected table
 * @param { boolean } force - if table is taken and force is true update will be forced
 * 
 * @throws { status: 403; reason: "Invalidtable" } - table is invalid
 * 
 */
router.post("/session/table", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { table, force } = req.body;
    const { status, userId } = res.locals as LocalLocals;

    if(!table) {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { tables: 1, } });

    if(!restaurant) {
        return res.status(404).send({ reason: "RestaurantNotFound" });
    }

    if(table > restaurant.tables!) {
        return res.status(403).send({ reason: "InvalidTable" });
    }

    if(!force) {
        const orders = await Orders(restaurantId).many({ type: "in", id: table.toString(), customer: { $ne: id(userId!) }, ip: { $ne: req.ip }, connected: { $gte: Date.now() - 60000 * 5 } }, { projection: { _id: 1 } });

        if(orders.length > 0) {
            console.log("CONFIRMED");
            return res.send({ confirm: true });
        }
    }


    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!) };
    } else {
        filter = { ip: req.ip };
    }

    const update = await Orders(restaurantId).one(filter).update({ $set: { id: table.toString(), connected: Date.now() } }, { projection: { _id: 1 } });
    res.send({ updated: update.ok == 1 });

    Orders(restaurantId).update({ type: "in", customer: { $ne: id(userId!) }, ip: { $ne: req.ip }, id: table.toString(), status: "ordering" }, { $set: { id: null! }})
});

/**
 * 
 * FRONTEND ERROR HANDLING
 * 
 * changes type of the order
 * 
 * @param { "in" | "out" } type - order type in(Table) or out(Take away)
 * 
 * @returns { updated: boolean }
 * 
 * @throws { status: 422; reason: "InvalidType" } - type is invalid
 * 
 */
router.post("/session/type", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { type } = req.body;
    const { status, userId } = res.locals as LocalLocals;

    if (!type || !["in", "out"].includes(type)) {
        return res.status(422).send({ reason: "InvalidType" });
    }

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { status: "ordering", customer: id(userId!) };
    } else {
        filter = { status: "ordering", ip: req.ip };
    }

    if (type == "out") {
        const oid = Math.floor(Math.random() * 1000).toString();
        const update = await Orders(restaurantId).one(filter).update({ $set: { type, id: oid } });

        return res.send({ updated: update.ok == 1, id: oid });
    }

    const update = await Orders(restaurantId).one(filter).update({ $set: { type, id: null! } });

    res.send({ updated: update.ok == 1 });
});

/**
 * 
 * FRONTEND ERROR HANDLING
 * 
 * sets comment to the order
 * 
 * @param { string } comment - the comment
 * 
 * @returns { updated: boolean; }
 * 
 * @throws { status: 422; reason: "InvalidComment" } - comment is invalid
 */
router.post("/session/comment", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { comment } = req.body;
    const { userId, status } = res.locals as LocalLocals;

    if(!comment || typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidComment" });
    }

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering" };
    } else {
        filter = { ip: req.ip, status: "ordering" };
    }

    const update = await Orders(restaurantId).update(filter, { $set: { comment } });


    res.send({ updated: update.modifiedCount > 0 });
});

/**
 * 
 * @param { string } dishId - id of dish   !not orderDishId!
 * @param { string | null } comment - comment to dish
 * 
 * @returns { updated: boolean; }
 * 
 * @throws { status: 422; reason: "InvalidDishId" } - invalid dish id
 * @throws { status: 422; reason: "InvalidDishComment" } - invalid comment to dish if provided
 */
router.post("/session/dish", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { dishId, comment } = req.body;
    const { status, userId } = res.locals as LocalLocals;

    if (!dishId || dishId.length != 24) {
        return res.status(422).send({ reason: "InvalidDishId" });
    } else if(comment && typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidDishComment" });
    }

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1, } });

    if (!dish) {
        return res.sendStatus(404);
    }

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering" };
    } else {
        filter = { ip: req.ip, status: "ordering" };
    }


    const update = await Orders(restaurantId).one(filter)
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

/**
 * 
 * @returns { comment: string; [] } - array of comments of selected dishes
 * 
 */
router.get("/session/dish/:dishId", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;
    const { userId, status } = res.locals as LocalLocals;

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering" };
    } else {
        filter = { ip: req.ip, status: "ordering" };
    }

    const order = await Orders(restaurantId).one(filter).get({ projection: { dishes: { dishId: 1, _id: 1, comment: 1, } } });

    const result = [];

    for(let i of order.dishes) {
        if(i.dishId.equals(dishId)) {
            result.push(i);
        }
    }

    res.send(result);
});

/**
 * removes dish from order
 * @param { string } orderDishId - req.params.orderDishId - id of dish in order
 */
router.delete("/session/dish/:orderDishId", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId, orderDishId } = req.params as any;
    const { userId, status } = res.locals as LocalLocals;


    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering" };
    } else {
        filter = { status: "ordering", ip: req.ip };
    }

    const update = await Orders(restaurantId).one(filter).update({ $pull: { dishes: { _id: id(orderDishId) } } }, { projection: { _id: 1 } });


    res.send({ updated: update.ok == 1 });
});

/**
 * sets a comment to a dish
 * @param { string } comment - comment to a dish req.body.comment
 * @param { string } orderDishId - id of the dish req.params.orderDishId
 * 
 * @returns { updated: boolean }
 * 
 * @throws { status: 422; reason: "InvalidDishComment" } - comment is invalid
 */
router.post("/session/dish/:orderDishId/comment", passUserId, passOrder({ _id: 1 }), async (req, res) => {
    const { restaurantId, orderDishId } = req.params as any;
    const { comment } = req.body;
    const { status, userId } = res.locals as LocalLocals;

    if(!comment || typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidDishComment" });
    }

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering", };
    } else {
        filter = { ip: req.ip, status: "ordering" };
    }

    const update = await Orders(restaurantId).one(filter)
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
    theme: string;
    type: "in" | "out";
    id: string | null;
    dishes: { name: string; price: number; amount: number; }[];
    clientSecret?: string;
    paymentIntentId?: string;
    methods: { last4: string; brand: string; id: string; }[];
    _id: ObjectId;
    savePaymentMethod: boolean;
}; router.get("/session/payment-info", passUserId, passOrder({ type: 1, id: 1, dishes: { dishId: 1 } }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { order, status, userId } = res.locals as LocalLocals;

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "ordering" };
    } else {
        filter = { ip: req.ip, status: "ordering" };
    }


    const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1, theme: 1, stripeAccountId: 1, } });
    if(!restaurant) {
        return res.sendStatus(404);
    }
    

    let user: User | null | undefined;
    if(userId) {
        user = await getUser(userId, { projection: { stripeCustomerId: 1 } });
    }


    const result: PaymentInfo = {
        card: restaurant.money!.card == "enabled",
        cash: restaurant.money!.cash == "enabled",
        total: 0,
        subtotal: 0,
        hst: 0,
        type: order.type,
        id: order.id,
        dishes: [],
        methods: [],
        _id: order._id,
        theme: restaurant.theme || "orange",
        savePaymentMethod: status != "noinfo",
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

    Orders(restaurantId).one(filter).update({ $set: { money: { total: result.total, subtotal: result.subtotal, hst: result.hst } } });


    if(user && user.stripeCustomerId) {
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
        if(user && user.stripeCustomerId) {
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
                    customerIp: req.ip,
                    orderId: order._id.toString(),
                },
                transfer_data: {
                    destination: restaurant.stripeAccountId!,
                },
                payment_method_options: {
                    card: {
                        setup_future_usage: "off_session",
                    },
                }
            });
    
            result.clientSecret = p.client_secret!;
            result.paymentIntentId = p.id;
        } else {
            console.log("NO USER OR NO STRIPECUSOMERID");
            console.log("USER: ", user);
            const p = await stripe.paymentIntents.create(
                {
                    amount: result.total,
                    currency: "usd",
                    transfer_data: {
                        destination: restaurant.stripeAccountId!,
                    },
                    metadata: {
                        restaurantId: restaurantId,
                        customerId: user?._id.toString()!,
                        customerIp: req.ip,
                        orderId: order._id.toString(),
                    },
                },
                );
                
            result.clientSecret = p.client_secret!;
            result.paymentIntentId = p.id;
            result.savePaymentMethod = false;
        }
    } catch (e: any) {
        console.log(e.type);
        if (e.type == "StripeInvalidRequestError") {
            const p = await stripe.paymentIntents.create(
                {
                    amount: result.total,
                    currency: "usd",
                    transfer_data: {
                        destination: restaurant.stripeAccountId!,
                    },
                    metadata: {
                        restaurantId: restaurantId,
                        customerIp: req.ip,
                        customerId: user?._id.toString()!,
                        orderId: order._id.toString(),
                    },
                },
            );
                
            result.savePaymentMethod = false;
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
};
/**
 * 
 * FRONTEND ERROR HANDLING
 * 
 * used to get ordered orders for tracking
 * 
 * @returns { Tracking }
 * 
 * @throws { status: 404; reason: "NoOrders" } - user didn't order any orders
 * 
 */
router.get("/tracking", passUserId, async (req, res) => {
    const { restaurantId } = req.params as any;
    const { status, userId } = res.locals as LocalLocals;

    let filter: Filter<Order>;
    if(status == "loggedin" || status == "loggedout") {
        filter = { customer: id(userId!), status: "progress" };
    } else {
        filter = { status: "progress", ip: req.ip };
    }

    const orders = await Orders(restaurantId).many(filter, { projection: { dishes: 1, id: 1, type: 1, ordered: 1, } });

    if(!orders || orders.length == 0) {
        return res.status(404).send({ reason: "NoOrders" });
    }

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