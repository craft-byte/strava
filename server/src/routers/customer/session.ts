import { NextFunction, Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { io, stripe } from "../..";
import { Order, OrderStatus, OrderType, WaiterRequestReason } from "../../models/Order";
import { id } from "../../utils/functions";
import { sendMessageToWaiter } from "../../utils/io";
import * as jsonwebtoken from "jsonwebtoken";
import { passUserData } from "../../utils/middleware/logged";
import { Orders } from "../../utils/orders";
import { Restaurant } from "../../utils/restaurant";
import { getUser, updateUser } from "../../utils/users";
import { PRIV_KEY } from "../../utils/passport";
import { strictEqual } from "assert";
import Stripe from "stripe";
import { User } from "../../models/general";
import { stat } from "fs";


const router = Router({ mergeParams: true });


interface LocalLocals {
    status: "loggedin" | "loggedout" | "noinfo";
    userId: string | null;
    order: Order;
    ct: ObjectId;
}



interface InitResponse {
    settings: {
        allowTakeOut?: boolean;
        allowDineIn?: boolean;
        onlineOrdering?: boolean;
        maxDishes?: number;
        cashPayments?: boolean;
        cardPayments?: boolean;
    };

    restaurant: {
        _id: ObjectId;
        name: string;
        theme: string;
    };

    order?: {
        dishes: {
            name: string;
            price: number;
            dishId: ObjectId;
            _id: ObjectId;
            comment: string;
        }[];
        type: "dinein" | "takeout";
        id: string;
        comment?: string;
        _id: ObjectId;
    };

    user?: {
        avatar: any;
        _id: ObjectId;
        name: {
            first: string;
            last: string;
        };
    };
    
    dish?: {
        name: string;
        price: number;
        time: number;
        general: string;
        _id: ObjectId;
        image: {
            binary: any;
            resolution: any;
        };
    };

    waiterRequest?: {
        _id: ObjectId;
        reason: WaiterRequestReason,
        accepted: boolean;
        canceled: boolean;
        waiter?: {
            name: string;
            avatar: any;
            _id: ObjectId;
        }
    }


    userStatus: "loggedin" | "loggedout" | "noinfo";
    customerToken?: ObjectId;
    
    sendSocketId?: boolean;
}
/**
 * called in order.page
 * 
 * returns order data
 * 
 * creates order if neede
 */
router.get("/init", (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        const customerToken = req.headers["customer-token"];

        if(customerToken && typeof customerToken != "string") {
            return res.status(422).send({ reason: "InvalidCustomerToken" });
        }

        res.locals.ct = id(customerToken);
        res.locals.status = "noinfo";
        return next();
    }
    const token = req.headers.authorization;

    const data: { userId: string; iat: number; exp: number; } = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

    if (Date.now() > data.exp) {
        res.locals.status = "loggedout";
    } else {
        res.locals.status = "loggedin";
    }

    res.locals.userId = data.userId;

    return next();
}, async (req, res) => {
    const { userId, status, ct } = res.locals as LocalLocals;
    const { socketId, table, dishId, customerToken: customerTokenNotChecked } = req.query;
    const { restaurantId } = req.params;


    const restaurant = await Restaurant(restaurantId).get({ projection: { info: { tables: 1, name: 1, theme: 1 }, settings: { customers: 1, money: 1, staff: { mode: 1 } } } });


    if (!restaurant || !restaurant.settings || !restaurant.settings.customers || !restaurant.settings.staff || !restaurant.settings.money || !restaurant.info?.tables) {
        return res.sendStatus(500);
    }



    // customerToken from queryParams
    let customerToken: string = undefined!;
    if(customerTokenNotChecked && typeof customerTokenNotChecked == "string" && customerTokenNotChecked.length == 24) {
        customerToken = customerTokenNotChecked;
    }


    let sessionSearchFilter: { customer?: ObjectId, customerToken?: ObjectId; status?: OrderStatus } = {};
    if ((status == "loggedin" || status == "loggedout") && !customerToken) {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        // customerToken is provided when a user is first created session not logged in and the logged in and returned to the session
        // in case above the ct is not provided, and instead customerToken provided as a queryParam
        sessionSearchFilter = { customerToken: ct! || id(customerToken)!, status: "ordering" };
    }

    const response: InitResponse = {
        settings: {
            onlineOrdering: restaurant.settings.customers.allowOrderingOnline,
            allowTakeOut: restaurant.settings.customers.allowTakeOut || false,
            allowDineIn: restaurant.settings.customers.allowDineIn || false,
            maxDishes: restaurant.settings.customers.maxDishes,
            cashPayments: restaurant.settings.money.cash == "enabled",
            cardPayments: restaurant.settings.money.card == "enabled",
        },
        restaurant: {
            name: restaurant.info.name!,
            theme: restaurant.info.theme || "orange",
            _id: restaurant._id
        },
        userStatus: status,
    };

    if(status == "loggedin" || status == "loggedout" && userId) {
        const user = await getUser(userId!, { projection: { avatar: 1, name: 1, } });

        if(user) {
            response.user = {
                avatar: user.avatar?.binary || null!,
                name: user.name!,
                _id: user._id
            };
        }
    }

    if (dishId && typeof dishId == "string" && dishId.length == 24) {
        const dish = await Restaurant(restaurant._id).dishes.one(dishId).get({
            projection: {
                name: 1,
                description: 1,
                info: { time: 1, },
                price: 1,
                general: 1,
                image: { binary: 1, resolution: 1 }
            }
        });

        response.dish = {
            ...dish,
            time: dish?.info.time,
        } as any;
    }


    const orderExists = await Orders(restaurantId).one(sessionSearchFilter).get({ projection: { socketId: 1, type: 1, id: 1, } });
    if (orderExists) {

        const updateFilter: any = { $set: {} };

        if (!socketId || typeof socketId != "string") {
            response.sendSocketId = true;
        } else if (orderExists.socketId != socketId) {

            // join user to restaurant's socket room
            io.in(socketId).socketsJoin([`${restaurantId}/customers`]);

            updateFilter["$set"]["socketId"] = socketId;
        }
        

        if (table && typeof table == "string" && !isNaN(+table) && restaurant.info.tables >= +table) {
            if (orderExists.type == "takeout") {
                updateFilter["$set"]["type"] = "dinein";
            }
            updateFilter["$set"]["id"] = table;
        }

        if(customerToken! && (status == "loggedin" || status == "loggedout")) {
            updateFilter["$set"]["customerToken"] = null;
            updateFilter["$set"]["customer"] = id(userId!);


            // if user has ahd an ongoing session and was logged in at that time that session should be removed.
            // for example user in the past was loggedin and created a session
            // now user created session but not logged in
            // and now the user logs in and comes back to the order page and this endpoing gets called with customerToken to change the order to customerId
            // older sessions with the same customerId should be deleted
            await Orders(restaurantId).deleteMany({ customer: id(userId!) });
            
            // the update below will update the newer version, will assign customer id to the newer session
            // the old session should be deleted because it can cause calculating wrong amount
        }


        const update = await Orders(restaurantId).one(sessionSearchFilter).update(updateFilter, { projection: { type: 1, customerToken: 1, id: 1, dishes: 1, waiterRequests: 1, comment: 1, } });

        const order = update.order;

        response.order = {
            type: order.type,
            id: order.id,
            dishes: await parseDishes(restaurantId, order.dishes),
            _id: order._id,
            comment: order.comment!,
        }


        // if a user requested a waiter and reloaded the page
        if(order.waiterRequests.length > 0) {
            response.waiterRequest = await findAndParseWaiterRequest(order.waiterRequests);
        }


        // send customerToken to user to access the session later
        response.customerToken = order.customerToken!;

        return res.send(response);
    }


    const newSession: Order = {
        mode: restaurant.settings.staff.mode,
        status: "ordering",
        waiterRequests: [],
        by: "customer",
        dishes: [],
        _id: id()!,
        customerToken: null!,
        customer: null!,
        socketId: null!,
        type: null!,
        id: null!,
    }


    // if user is not logged in create customerToken
    if (status == "noinfo") {
        newSession.customerToken = id();

        // send customerToken to user to access the session later
        response.customerToken = newSession.customerToken;
    } else {
        newSession.customer = id(userId!);
    }


    // if socketId was sent save it to the session, else ask to send it  POST /socketId
    if (socketId && typeof socketId == "string") {
        newSession.socketId = socketId;

        // join user to restaurant's socket room
        io.in(socketId).socketsJoin([`${restaurantId}/customers`]);
    } else {
        response.sendSocketId = true;
    }

    // if table was sent assign it to the session, else assign dinein type   SHOULD DO SOMETHING ELSE
    if (table && typeof table == "string" && !isNaN(+table) && restaurant.info.tables >= +table) {
        newSession.type = "dinein";
        newSession.id = table;
    } else {
        newSession.type = "dinein";
    }


    // add session to sessions db in restaurantId collection
    const isCreatedSuccessfuly = await Orders(restaurantId).createSession(newSession);

    if (!isCreatedSuccessfuly) {
        return res.status(500).send({ retry: true });
    }

    response.order = {
        dishes: [],
        type: newSession.type,
        id: newSession.id,
        _id: newSession._id
    }

    res.send(response);
});


/**
 * sets the socket id to a session so it can be sent messages
 */
router.post("/socketId", passUserData, async (req, res) => {
    const { socketId } = req.body;
    const { restaurantId } = req.params;
    const { userId, status, ct } = res.locals as LocalLocals;

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), };
    } else {
        sessionSearchFilter = { customerToken: ct, };
    }

    console.log(socketId);

    const update = await Orders(restaurantId).update(sessionSearchFilter, { $set: { socketId: socketId } });


    res.send({ updated: update.modifiedCount > 0 });
});


router.post("/type", passUserData, async (req, res) => {
    const { restaurantId } = req.params;
    const { userId, status, ct } = res.locals;
    const { type: t } = req.body;

    if (!t || typeof t != "string" || !["dinein", "takeout"].includes(t)) {
        return res.sendStatus(422);
    }

    const type = t as OrderType;

    const restaurant = await Restaurant(restaurantId).get({ projection: { settings: { customers: 1 } } });

    if (!restaurant || !restaurant.settings || !restaurant.settings.customers) {
        return res.sendStatus(500);
    }

    if (

        // if type = takeout and takeouts are disabled
        (type == "takeout" && !restaurant.settings.customers.allowTakeOut)

        ||

        // or if type = dinein and dineins are disabled
        (type == "dinein" && !restaurant.settings.customers.allowDineIn)
    ) {
        return res.status(403).send({ reason: "TypeNotAllowed" });
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const $set: any = {
        type: type
    };

    if (type == "takeout") {
        // id for takeout number
        // 4 random number
        // 0 - 8999
        $set.id = (Math.floor(Math.random() * 9000) + 1000).toString();
    } else if (type == "dinein") {
        $set.id = null;
    }


    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $set });

    res.send({ updated: update.ok == 1, id: $set.id });
});
router.post("/table", passUserData, async (req, res) => {
    const { restaurantId } = req.params;
    const { table } = req.body;
    const { ct, userId, status } = res.locals as LocalLocals;

    if (!table || typeof table != "string" || isNaN(+table)) {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { info: { tables: 1 }, settings: { customers: { allowDineIn: 1 } } } });

    // if restaurant doesn't have settings or table
    if (!restaurant || !restaurant.settings || !restaurant.settings.customers || !restaurant.info || !restaurant.info.tables || restaurant.info.tables < 1) {
        return res.sendStatus(500);
    }

    // if restaurant disabled dinein
    if (restaurant.settings.customers.allowDineIn) {
        return res.status(403).send({ reason: "TypeNotAllowed" });
    }

    // if provided table is higher than allowed
    if (restaurant.info.tables < +table) {
        return res.status(403).send({ reason: "InvalidTable" });
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const update = await Orders(restaurant._id).one(sessionSearchFilter).update({ $set: { id: table } });

    res.send({ updated: update.ok == 1 });
});

router.post("/comment", passUserData, async (req, res) => {
    const { restaurantId } = req.params;
    const { comment: c } = req.body;
    const { ct, userId, status } = res.locals as LocalLocals;

    if (!c || typeof c != "string" || c.length < 1) {
        return res.sendStatus(422);
    }


    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const comment = c == "REMOVECOMMENT" ? null : c;


    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $set: { comment: comment! } });


    res.send({ updated: update.ok == 1 });
});


router.post("/dish", passUserData, async (req, res) => {
    const { userId, status, ct } = res.locals as LocalLocals;
    const { restaurantId } = req.params;
    const { dishId, comment } = req.body;

    if (comment && typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidComment" });
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const addedDishId = id();

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({
        $set: {
            money: null!
        },
        $push: {
            dishes: {
                status: "ordered",
                _id: addedDishId,
                dishId: id(dishId),
                comment: comment?.trim(),
                id: (Math.floor(Math.random() * 900) + 100).toString(),
            }
        }
    });

    res.send({ updated: update.ok == 1, insertedId: addedDishId });
});
router.delete("/dish/:orderDishId", passUserData, async (req, res) => {
    const { userId, status, ct } = res.locals as LocalLocals;
    const { restaurantId, orderDishId } = req.params;


    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $pull: { dishes: { _id: id(orderDishId) } }, $set: { money: null! } });

    res.send({ updated: update.ok == 1 });
});
router.post("/dish/:orderDishId/comment", passUserData, async (req, res) => {
    const { restaurantId, orderDishId } = req.params;
    const { comment } = req.body;
    const { userId, status, ct } = res.locals as LocalLocals;

    if (!comment || typeof comment != "string") {
        return res.sendStatus(422);
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $set: { "dishes.$[dish].comment": comment.trim() } }, { arrayFilters: [{ "dish._id": id(orderDishId) }] })

    res.send({ updated: update.ok == 1 });
});



router.post("/requestWaiter", passUserData, async (req, res) => {
    const { status, userId, ct } = res.locals as LocalLocals;
    const { restaurantId } = req.params;
    const { reason } = req.body;

    if(!reason || typeof reason != "string" || !["cash", "other", "payment.error"].includes(reason)) {
        return res.sendStatus(422);
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }



    const requestId = id()!;

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({
        $push: {
            waiterRequests: {
                requestedTime: Date.now(),
                reason: reason as any,
                active: true,      
                _id: requestId,
            }
        }
    });

    if(update.ok == 1) {

        sendMessageToWaiter(restaurantId, "request/new", {
            requestId: requestId,
            reason: reason as any,
        });

    }

    res.send({ success: update.ok == 1, requestId });
});
router.delete("/waiterRequest/:waiterRequestId", passUserData, async (req, res) => {
    const { userId, ct, status } = res.locals as LocalLocals;
    const { restaurantId, waiterRequestId } = req.params;

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }


    const update = await Orders(restaurantId)
        .one(sessionSearchFilter)
        .update(
            { $set: {
                "waiterRequests.$[waiterRequestId].active": false,
                "waiterRequests.$[waiterRequestId].requestCanceledTime": Date.now(),
            } },
            {
                arrayFilters: [ { "waiterRequestId._id": id(waiterRequestId) } ]
            }
        );

    if(update.ok == 1) {
        sendMessageToWaiter(restaurantId, "request/removed", {
            requestId: waiterRequestId,
        });
    }

    res.send({ updated: update.ok == 1 });
});


interface CheckoutResponse {
    dishes?: {
        amount: number;
        name: string;
        dishId: ObjectId;
        totalPrice: number;
    }[];

    order?: {
        type: OrderType;
        id: string;
        _id: ObjectId;
    };

    money?: {
        subtotal: number;
        hst: number;
        total: number;
    };

    paymentMethods?: {
        last4: string;
        brand: string;
        id: string;
        postalCode?: string;
    }[];

    clientSecret?: string;
}
router.get("/checkout", passUserData, async (req, res) => {
    const { restaurantId } = req.params;
    const { userId, status, ct } = res.locals as LocalLocals;


    const restaurant = await Restaurant(restaurantId).get({ projection: { stripeAccountId: 1, settings: { customers: 1, } } });

    if(!restaurant || !restaurant.stripeAccountId || !restaurant.settings || !restaurant.settings.customers) {
        return res.sendStatus(500);
    }


    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }


    let user: User;
    if(status == "loggedin") {
        const u = await getUser(userId!, { projection: { stripeCustomerId: 1 } });

        if(u) {
            user = u;
        }
    }


    const order = await Orders(restaurantId).one(sessionSearchFilter).get({ projection: {
        type: 1,
        id: 1,
        money: 1,
        paymentIntentId: 1,
        dishes: {
            dishId: 1,
        },
    } });


    if(order.dishes.length == 0) {
        return res.status(403).send({ reason: "InvalidDishes" });
    }

    const dishes = await sortDishes(restaurantId, order.dishes);

    const response: CheckoutResponse = {
        dishes,
        money: order.money,
        order: {
            type: order.type,
            id: order.id,
            _id: order._id
        }
    }


    // if customer has account and is loggedin, send saved methods
    if(status == "loggedin" && user! && user.stripeCustomerId) {
        response.paymentMethods = await getPaymentMethods(user.stripeCustomerId);
    }


    
    // no money means that customer's session first time on checkout or customer's session changed the dishes
    if(!order.money) {
        // calculate subtotal, hst, total
        let subtotal = 0;
        let total = 0;
        let hst = 0;
    
        for(let { totalPrice } of dishes) {
            subtotal += totalPrice;
        }
    
        hst = +(subtotal * 0.13).toFixed(0);
        total = +(hst + subtotal).toFixed(0);

        response.money = {
            subtotal,
            total,
            hst,
        };

        
        
        // update Order.money and possibly add Order.paymentIntentId
        let orderUpdate: any = { money: response.money };

        
        // if we are here that means that session's payment intent has to be created or updated
        if(order.paymentIntentId) {
            try {
                const update = await stripe.paymentIntents.update(
                    order.paymentIntentId,
                    {
                        customer: (user! && user.stripeCustomerId) ? user.stripeCustomerId : null!,
                        amount: response.money!.total
                    }
                );

                // set client secret
                response.clientSecret = update.client_secret!;
            } catch (e: any) {
                if(e.raw.code == "payment_intent_unexpected_state") {

                } else {
                    throw e;
                }
            }
        }

        // add payment intent id only if ordering online is allowed && if paymentIntent was not yet created
        if(restaurant.settings.customers.allowOrderingOnline && !response.clientSecret) {

            if(status == "loggedin" && response.paymentMethods && response.paymentMethods.length > 0) {
                const invoice = await stripe.invoices.create({
                    
                })
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: response.money!.total,
                currency: "cad",
                customer: (user! && user.stripeCustomerId) ? user.stripeCustomerId : null!,
                setup_future_usage: "off_session",
                transfer_data: {
                    destination: restaurant.stripeAccountId
                },
                metadata: {
                    restaurantId: restaurantId,
                    sessionId: order._id.toString()
                }
            });

            orderUpdate.paymentIntentId = paymentIntent.id;

            // set client secret
            response.clientSecret = paymentIntent.client_secret!;
        }

        
        
        // update money so next time if session is not changed this block will not run
        Orders(restaurantId).one(sessionSearchFilter).update({ $set: orderUpdate });
    }


    // get client secret if wasn't added and if ordering online is allowed
    if(!response.clientSecret && restaurant.settings.customers.allowOrderingOnline && order.paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

        if(!paymentIntent.customer && status == "loggedin" && user! && user.stripeCustomerId) {
            stripe.paymentIntents.update(order.paymentIntentId, { customer: user.stripeCustomerId });
        }

        response.clientSecret = paymentIntent.client_secret!;
    }
    
    
    res.send(response);
});


router.post("/signout", passUserData, async (req, res) => {
    const { status, userId, ct } = res.locals as LocalLocals;
    const { restaurantId } = req.params;

    if(status == "noinfo") {
        return res.sendStatus(403);
    }


    let sessionSearchFilter: any = { customer: id(userId!), status: "ordering" };

    const customerToken = id();

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $set: { customer: null, customerToken: customerToken,  } })


    res.send({ updated: update.ok == 1, customerToken: customerToken });
});

router.post("/replacePaymentIntent", passUserData, async (req, res) => {
    const { userId, status, ct } = res.locals;
    const { restaurantId } = req.params;


    const restaurant = await Restaurant(restaurantId).get({ projection: { stripeAccountId: 1 } });

    if(!restaurant || !restaurant.stripeAccountId) {
        return res.sendStatus(500);
    }

    let sessionSearchFilter: any = {};
    if (status == "loggedin" || status == "loggedout") {
        sessionSearchFilter = { customer: id(userId!), status: "ordering" };
    } else {
        sessionSearchFilter = { customerToken: ct, status: "ordering" };
    }


    const order = await Orders(restaurantId).one(sessionSearchFilter).get({ projection: { money: 1 } });

    if(!order.money) {
        return res.sendStatus(403);
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: order.money.total!,
        currency: "cad",
        transfer_data: {
            destination: restaurant.stripeAccountId,
        },
        metadata: {
            restaurantId: restaurantId,
            sessionId: order._id.toString()
        }
    });

    const update = await Orders(restaurantId).one(sessionSearchFilter).update({ $set: { paymentIntentId: paymentIntent.id } })

    res.send({ updated: update.ok == 1, clientSecret: paymentIntent.client_secret })
});



export {
    router as SessionRouter
}





async function sortDishes(restaurantId: string, dishes: Order["dishes"]): Promise<{ name: string; totalPrice: number; dishId: ObjectId; amount: number; }[]> {
    // Create a map to store the counts of each dish
    const counts = new Map<string, number>();
    for (const dish of dishes) {
        // Increment the count for each dish
        const count = counts.get(dish.dishId.toString()) || 0;
        counts.set(dish.dishId.toString(), count + 1);
    }

    // Create an array of promises to get the name and price for each dish
    const promises = [];
    for (const [dishId, amount] of counts) {
        promises.push(getDishPriceName(restaurantId, dishId as any));
    }

    // Wait for all promises to resolve and get the names and prices for each dish
    const results = await Promise.all(promises);

    // Create the sorted dishes array
    const sorted: { name: string; totalPrice: number; dishId: ObjectId; amount: number; }[] = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (!result || !result.name || !result.price) {
            continue;
        }
        const amount = counts.get(result._id.toString());
        if(!amount) {
            continue;
        }
        const totalPrice = amount * result.price;
        sorted.push({
            name: result.name,
            dishId: result._id,
            amount,
            totalPrice
        });
    }

    // Return the sorted dishes array
    return sorted;
}


async function parseDishes(restaurantId: string, dishes: Order["dishes"]) {


    const promises = [];
    for (let dish of dishes) {
        promises.push(getDishPriceName(restaurantId, dish.dishId));
    }

    const namesPrices = await Promise.all(promises);

    const findDish = (dishId: ObjectId) => {
        for (let dish of namesPrices) {
            if (dish?._id.equals(dishId)) {
                return dish;
            }
        }

        return null;
    }

    const result: { _id: ObjectId; price: number; comment: string; name: string; dishId: ObjectId; }[] = [];
    for (let i = 0; i < dishes.length; i++) {
        const namePrice = findDish(dishes[i].dishId);

        if (!namePrice) {
            continue;
        }


        result.push({
            name: namePrice.name!,
            price: namePrice.price!,
            dishId: dishes[i].dishId,
            _id: dishes[i]._id,
            comment: dishes[i].comment,
        });
    }

    return result;
}

async function getDishPriceName(restaurantId: string, dishId: ObjectId) {
    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1 } });

    return result;
}

async function findAndParseWaiterRequest(allRequests: Order["waiterRequests"]): Promise<InitResponse["waiterRequest"]> {

    for(let request of allRequests) {
        if(!request.active) {
            continue;
        }

        let waiter;

        if(request.waiter) {
            const user = await getUser(request.waiter, { projection: { name: 1, avatar: { binary: 1 }, } });

            if(user) {
                waiter = {
                    name: `${user?.name?.first} ${user.name?.last}`,
                    avatar: user.avatar?.binary,
                    _id: user._id,
                };
            }
        }

        return {
            accepted: !!request.waiter && !! request.requestAcceptedTime,
            canceled: !!request.requestCanceledTime,
            _id: request._id,
            reason: request.reason,
            waiter: waiter as any,
        };
    }

}

async function getPaymentMethods(stripeCustomerId: string) {

    if(!stripeCustomerId) {
        return null!;
    }

    const paymentMethods: Stripe.ApiList<Stripe.PaymentMethod> = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card"
    });

    if(!paymentMethods || paymentMethods.data.length == 0) {
        return null!;
    }


    const result = [];

    for(let method of paymentMethods.data) {
        if(!method.card) {
            continue;
        }

        result.push({
            last4: method.card.last4,
            brand: method.card.brand,
            id: method.id,
            postalCode: method.billing_details.address.postal_code
        });
    }

    console.log(paymentMethods);


    return result!;
}