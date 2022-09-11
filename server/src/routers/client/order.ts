import { Router } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { resourceLimits } from "worker_threads";
import { stripe } from "../..";
import { Order } from "../../models/general";
import { DishHashTableUltra } from "../../utils/dish";
import { id, log } from "../../utils/functions";
import { sendMessage } from "../../utils/io";
import { convertDishes, getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser } from "../../utils/users";
import { checkSession } from "./functions";


const router = Router({ mergeParams: true });


router.get("/authenticate", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1, settings: 1, } });

    res.send(restaurant);
});



router.post("/init", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { table } = req.body;

    const result: {
        dishes: { [category: string]: any };
        check?: any;
        type: "in" | "out";
        sessionExists: boolean;
        restaurantId: string;
        ui: {
            title: string;
            showTypes: boolean;
            showDishes: boolean;
            theme?: string;
        };
    } = {
        type: table ? "in" : "out",
        dishes: {},
        sessionExists: false,
        restaurantId,
        ui: {
            showTypes: false,
            showDishes: true,
            title: "Ctraba"
        }
    };

    if (table && typeof table != "number") {
        return res.sendStatus(422);
    }



    const types = ["b", "e", "so", "sa", "a", "si", "d"];

    result.check = await checkSession(restaurantId, result.type, table, req.user as string);


    const sessions = await Orders(restaurantId).many(
        { status: "ordering", customer: id(req.user as string) },
        { projection: { _id: 1 } }
    );

    console.log(sessions);

    if (sessions && sessions.length > 0) {
        result.sessionExists = true
        if(sessions.length > 1) {
            console.log("LEAVE ONLY ONE SESSION -------------------------------------------=-=-=-=-=-=");
        }
    }


    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1, settings: 1, components: { amount: 1, _id: 1 } } });
    if (!restaurant) {
        return res.sendStatus(404);
    }


    if (restaurant.settings!.dishes.strictIngredients) {
        const get7Dishes = async (type: string, skip: number = 0) => {
            const dishes = await Restaurant(restaurantId).dishes
                .many({ general: type })
                .get({ projection: { cooking: { components: 1 } }, skip, limit: 7 });

            const result: ObjectId[] = [];

            for (let dish of dishes) {
                if (!dish.cooking) {
                    result.push(dish._id);
                    continue;
                }
                let run = true;
                let index = 0;
                while (run && dish.cooking!.components!.length > index) {
                    const dishComponent = dish.cooking!.components![index];
                    for (let component of restaurant.components!) {
                        if (dishComponent._id!.equals(component._id!)) {
                            if (dishComponent.amount! >= component.amount!) {
                                run = false;
                                break;
                            }
                        }
                    }
                    index++;
                }
                if (run) {
                    result.push(dish._id);
                }
            }

            if (result.length < 7 && dishes.length == 7) {
                result.push(...await get7Dishes(type, skip + 7));
            }

            return result;
        }
        for (let i of types) {
            result.dishes[i] = convertDishes(
                await Restaurant(restaurantId).dishes.many({ _id: { $in: await get7Dishes(i) } }).get({
                    projection: {
                        name: 1, price: 1, time: 1, image: { binary: 1, resolution: 1 }
                    }
                })
            );
        }
    } else {
        for (let i of types) {
            const search: any = { general: i };
            result.dishes[i] = convertDishes(await Restaurant(restaurantId).dishes.many(search).get({ projection: { name: 1, time: 1, price: 1, image: { binary: 1, resolution: 1 }, }, limit: 5 }));
        }
    }
    result.ui.showTypes = true;
    result.ui.showDishes = true;
    result.ui.theme = restaurant.theme;

    res.send(result);
});
router.get("/category/:category", async (req, res) => {
    const { restaurantId, category } = req.params as any;

    const foundDishes = await Restaurant(restaurantId).dishes.many({ general: category }).get({ projection: { name: 1, time: 1, price: 1, image: { binary: 1, resolution: 1, } } });

    const result: any = {
        slider1: [],
        big: [],
        slider2: [],
        other: []
    };

    for (let i of foundDishes) {
        if (i.image?.resolution == 1) {
            if (result.slider1.length != 2) {
                result.slider1.push(i);
            } else {
                result.slider2.push(i);
            }
        } else {
            if (result.big.length < 3) {
                result.big.push(i);
            } else {
                result.other.push(i);
            }
        }
    }

    res.send(result);
});
router.get("/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const convert = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1, general: 1, image: 1, time: 1, description: 1 } });

    if (!convert) {
        return res.sendStatus(404);
    }


    const result: any = {
        name: convert.name,
        category: convert.general!,
        price: (convert.price! / 100).toFixed(2),
        image: convert.image,
        time: convert.time,
        _id: convert._id,
        description: convert.description,
    };


    // const sessions = await Restaurant(restaurantId).aggregate([
    //     { $unwind: "$sessions" },
    //     { $match: { "sessions.customer": id(req.user as string) } },
    //     { $project: { session: "$sessions" } },
    // ]);

    const session = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) }).get({ projection: { dishes: { dishId: 1, _id: 1 } } });


    if (session) {
        result.quantity = 0;
        for (let i of session.dishes) {
            if (i.dishId.equals(dishId)) {
                result.quantity++;
            }
        }
    }


    res.send(result);
});
router.post("/convertDishes", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { dishes } = <{ dishes: string[] }>req.body;

    if (!dishes || dishes.length == 0) {
        return res.send([]);
    }

    const dishesPromises = [];
    const dishesQuantity = [] as { dishId: string; quantity: number; }[];

    for (let dish of dishes) {
        let add = true;
        for (let i of dishesQuantity) {
            if (i.dishId == dish) {
                i.quantity++;
                add = false;
                break;
            }
        }
        if (add) {
            dishesQuantity.push({ dishId: dish, quantity: 1 });
        }
    }


    for (let { dishId } of dishesQuantity) {
        dishesPromises
            .push(Restaurant(restaurantId).dishes.one(dishId).get({ projection: {
                    name: 1,
                    price: 1,
                    image: 1,
                    description: 1
                }
            }));
    }

    const foundDishes = await Promise.all(dishesPromises);

    if (foundDishes.length != dishesQuantity.length) {
        log('failed', "converting dishes lengths");
        return res.sendStatus(404);
    };


    const result = [];

    for (let i in foundDishes) {
        if (!foundDishes[i]) {
            return res.send([]);
        }
        result.push({
            quantity: dishesQuantity[i].quantity,
            name: foundDishes[i]?.name,
            image: foundDishes[i]?.image,
            _id: foundDishes[i]?._id,
            price: foundDishes[i]?.price,
            description: foundDishes[i]?.description,
            total: foundDishes[i]?.price! * dishesQuantity[i].quantity
        });
    }

    res.send(result);
});
router.get("/session/dishes", async (req, res) => {
    const { restaurantId } = req.params as any;

    // const result = await Restaurant(restaurantId).aggregate([
    //     { $unwind: "$sessions" },
    //     { $match: { "sessions.customer": id(req.user as string) } },
    //     { $project: { session: "$sessions" } },
    // ]);

    const session = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) }).get({ projection: { dishes: 1 } });

    if (!session) {
        return res.sendStatus(404);
    }

    const ids = () => {
        const arr: { dishId: string; quantity: number }[] = [];
        for (let i of session.dishes) {
            let add = true;
            for (let j of arr) {
                if (i.dishId.equals(j.dishId)) {
                    j.quantity++;
                    add = false;
                }
            }
            if (add) {
                arr.push({
                    dishId: i.dishId.toString(),
                    quantity: 1
                });
            }
        }
        return arr;
    }


    const dishes = new DishHashTableUltra(restaurantId, { name: 1, price: 1, image: { resolution: 1, binary: 1 } });

    let total = 0;
    for (let i of session.dishes) {
        total += (await dishes.get(i.dishId))?.price! / 100;
    }

    res.send({
        total: total.toFixed(2),
        dishes: dishes.table,
        sessionDishes: session.dishes,
        ids: ids(),
        sessionId: session._id,
    });
});
router.get("/session/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const session = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) }).get({ projection: { dishes: { comment: 1, _id: 1, dishId: 1 } } });

    if (!session) {
        return res.send(null);
    }

    const ids = [];

    for (let i of session.dishes) {
        if (i.dishId.equals(dishId)) {
            ids.push(i);
        }
    }

    res.send(ids);
});
router.delete("/session/dish/:sessionDishId", async (req, res) => {
    const { restaurantId, sessionDishId } = req.params as any;


    const result = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) })
        .update({
            $pull: { dishes: { _id: id(sessionDishId) } },
        }, { projection: { _id: 1 } });

    console.log("session dish removed: ", result.ok == 1);


    res.send({
        removed: result.ok == 1
    });
});
router.post("/session/dish/:sessionDishId/comment", async (req, res) => {
    const { restaurantId, sessionDishId } = req.params as any;
    const { comment } = req.body;

    const result = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string )})
        .update({ $set: { "dishes.$[dishId].comment": comment } }, { arrayFilters: [{ "dishId._id": id(sessionDishId) }], projection: { _id: 1 } })

    console.log("session dish comment updated: ", result.ok == 1);

    res.send({ updated: result.ok == 1 });
});
router.post("/session/confirm", async (req, res) => {
    const { restaurantId } = req.params as any;

    const session = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) }).get({ projection: { _id: 1 } });

    if (!session) {
        console.log("NO SESSIOn");
        return res.sendStatus(404);
    }

    const result = await Orders(restaurantId).one({ _id: session._id }).update(
        { $set: {
            connected: undefined,
            status: "progress",
            ordered: Date.now(),
        } },
        { returnDocument: "after", projection: { dishes: 1 } }
    );

    if(result.ok == 0) {
        return res.sendStatus(500);
    }



    res.send({ success: true });

    const order = result.order;

    const ids = new Set<string>();

    for (let i of order.dishes!) {
      ids.add(i.dishId.toString());
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).get({ projection: { general: 1, } });

    const forKitchen = [];
    const time = getDelay(order.ordered!);
    for (let i in order.dishes!) {
      for (let { general, _id } of dishes) {
        if (_id.equals(order.dishes[i].dishId)) {
        forKitchen.push({
            orderId: order._id,
            ...order.dishes![i],
            time,
            general: general
          });
        }
      }
    }


    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/order/new",
        event: "kitchen",
        data: result,
    });


    for(let i of session.dishes) {
        await Restaurant(restaurantId).dishes.one(i.dishId).update({ $inc: { bought: 1 } });
    }
});
router.post("/session/dish", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { dishId, comment } = req.body;

    if (!dishId || dishId.length != 24) {
        return res.sendStatus(422);
    }

    const newDish: Order["dishes"][0] = {
        dishId: id(dishId)!,
        comment: comment,
        _id: id()!,
        status: "ordered",
    }

    // const result = await Restaurant(restaurantId)
    //     .update(
    //         { $push: { "sessions.$[sessionId].dishes": newDish } },
    //         { arrayFilters: [{ "sessionId.customer": id(req.user as string) }] }
    //     );

    const result = await Orders(restaurantId).one({ status: "ordering", customer: id(req.user as string) })
        .update({ $push: { dishes: newDish } }, { projection: { _id: 1 } });


    console.log("dish added: ", result!.ok == 1);

    res.send({ updated: result!.ok == 1 });


});


router.get("/session/payment-intent", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1, settings: 1, stripeAccountId: 1 } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    if(restaurant.money.card != "enabled") {
        return res.status(403).send({ reason: "card" });
    }

    const user = await getUser(req.user as string, { projection: { stripeCustomerId: 1 } });

    if (!user) {
        return res.sendStatus(404);
    }

    
    const session = await Orders(restaurantId).one({ customer: id(req.user as string), status: "ordering" }).get({ projection: { dishes: { dishId: 1, _id: 1 } } });
    
    if (!session) {
        return res.sendStatus(404);
    };
    
    if(!restaurant.stripeAccountId) {
        return res.sendStatus(500);
    }

    const result: {
        amount: number;
        intent?: Stripe.PaymentIntent;
        cards?: any[];
    } = {
        amount: 0,
    };

    const dishes = new DishHashTableUltra(restaurantId, { price: 1 });


    for (let i of session.dishes) {
        const dish = (await dishes.get(i.dishId));
        if (dish) {
            result.amount += dish.price!;
        }
    }

    if(restaurant.settings?.customers.maxPrice != "unlimited" && result.amount > restaurant.settings?.customers.maxPrice!) {
        return res.status(403).send({ reason: "amount" });
    }

    try {
        try {
            const externalAccounts = await stripe.customers.listPaymentMethods(user.stripeCustomerId!, { type: "card" });

            if(externalAccounts.data.length > 0) {
                result.cards = [];
                for(let i of externalAccounts.data) {
                    // if(i.status != "verification_failed" && i.status != "errored") {
                        result.cards.push({
                            id: i.id,
                            brand: i.card?.brand,
                            last4: i.card?.last4,
                            name: i.billing_details.address?.postal_code
                        });
                    // }
                }
            }
        } catch (e) {
            throw e;
        }
        try {
            result.intent = await stripe.paymentIntents.create(
                {
                    amount: result.amount,
                    customer: user.stripeCustomerId,
                    currency: "usd",
                    payment_method_types: ["card"],
                    setup_future_usage: "off_session",
                    metadata: {
                        restaurantId: restaurantId,
                        customerId: user._id!.toString(),
                        orderId: session._id.toString(),
                    },
                    transfer_data: {
                        destination: restaurant.stripeAccountId,
                    },
                    payment_method_options: {
                        card: {
                            setup_future_usage: "off_session"
                        }
                    }
                },
            );
        } catch (e: any) {
            console.log(e.type);
            if (e.type == "StripeInvalidRequestError") {
                result.intent = await stripe.paymentIntents.create(
                    {
                        amount: result.amount,
                        currency: "usd",
                        payment_method_types: ["card"],
                        transfer_data: {
                            destination: restaurant.stripeAccountId,
                        },
                    },
                );
            } else {
                throw e;
            }
        }

        result.amount /= 100;

        res.send(result);
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
        // throw err;
    }
});


router.get("/live", async (req, res) => {
    const { restaurantId } = req.params as any;

    const found = await Orders(restaurantId).many({ customer: id(req.user as string) });

    if (!found || found.length == 0) {
        return res.send([]);
    }

    const result = [];

    for (let order of found.sort((a, b) => a.ordered! - b.ordered!)) {
        const converted = [];

        const dishes = new DishHashTableUltra(restaurantId, { name: 1, image: { binary: 1, resolution: 1, } });

        for (let i of order.dishes) {
            converted.push({
                ...await dishes.get(i.dishId),
                _id: i._id,
                status: i.status,
            });
        }

        result.push({
            time: getDelay(order.ordered!),
            type: order.type,
            number: order.id,
            dishes: converted,
            _id: order._id,
        });
    }

    res.send(result);
});


export {
    router as OrderRouter
}