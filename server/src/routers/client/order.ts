import { Router } from "express";
import { ObjectId } from "mongodb";
import { BoolEnum } from "sharp";
import { checkServerIdentity } from "tls";
import { stripe } from "../..";
import { Id } from "../../models/components";
import { DishHashTableUltra, getDishPromise } from "../../utils/dish";
import { getDate, id, log } from "../../utils/functions";
import { convertDishes } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { aggregateUser, updateUser } from "../../utils/users";
import { checkSession } from "./functions";


const router = Router({ mergeParams: true });


router.get("/authenticate", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1, settings: 1, } });

    res.send(restaurant);
});




// user comes
// user scans
// user didn't order anything
// user leaves
// user comes back immediately
// user doesn't have to scan nothin again


// 1 save session id in the url
// 2 if user reloads page he just continues shoping
// 3 if no session id in the url search for session in db
// 3 if session is found offer to user to continue and ask to scan qr code or make order.
// 3 if session not found ask to do stuff and create new session.

// 2.2 check if another user's using the first user's session's table
// 2.2 if so then check if the new table's user has dishes COOKING if does then ask first user to scan another's table qr code
// 2.2 if no then ask the first user if he sure about sitting on the table cus there are other user's session.





// how it goes:

// 1 user1 comes to the restaurant
// 2 user1 choses to stay in restaurant and scans table's qr code
// 3 user1 sent socket request and created session
// 4 user1's is changed. Added session id
// 5 user1 goes to the washroom
// 6 user2 comes to the restaurant
// 7 user2 decides to stay in restaurant and scans user1's table's qr code
// 8 user2 is informed that this table is in use but he doesn't see anybody so choses to stay at this table

// option 1
// 1 user2 goes to the washroom too
// 2 user1 comes back and doesn't see anybody so sits and started shoping.
// 3 user2 comes back and sees user1 so he has to change his table
// end

// option 2
// 1 user2 ordered dishes and they're cooking
// 2 user2 goes to the washroom
// 3 user1 comes back
// 4 user1 is not allowed to continue shoping on the table because user2's dishes are already cooking
// 5 user1 has to choose another table
// end

// options 3
// 1 user1 before going to the washroom ordered dishes and the dishes are cooking
// 2 user2 can't use the user1's table
// end


router.post("/init", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { sessionId } = req.body;

    const types = ["b", "e", "so", "sa", "a", "si", "d"];

    const result: {
        dishes: { [category: string]: any };
        session?: {
            dishes: any[];
            date: string;
            type: "order" | "table";
            number: number;
            hasToChange: boolean;
            askToChange: boolean;
        };
        ui: {
            title: string;
            showTypes: boolean;
            showDishes: boolean;
        }
    } = {
        dishes: {},
        ui: {
            showTypes: false,
            showDishes: true,
            title: "Ctraba"
        }
    };


    const sessions = await Restaurant(restaurantId).aggregate([
        { $unwind: "$sessions" },
        { $match: sessionId ? { "sessions._id": id(sessionId) } : { "sessions.userId": id(req.user as string) } },
        { $project: { date: "$sessions.date", _id: "$sessions._id", number: "$sessions.number", type: "$sessions.type", dishes: "$sessions.dishes" } },
    ]);
    if (sessions[0]) {
        const { date, dishes, type, number, _id } = sessions[0] as { _id: Id; number: number; type: "order" | "table", date: Date, dishes: { _id: ObjectId, dishId: ObjectId, comment: string; }[] };

        const ids = new Set<string>();

        for (let i of dishes) {
            ids.add(i.dishId.toString());
        }

        const convertDishes = await Restaurant(restaurantId).dishes
            .many({ _id: { $in: Array.from(ids).map(a => id(a)) } })
            .get({ projection: { name: 1, price: 1 } });

        const convertedDishes = [];

        for (let i of convertDishes) {
            if (i) {
                let count = 0;
                for (let i of dishes) {
                    if (i.dishId.equals(i._id)) {
                        count++;
                    }
                }
                convertedDishes.push({
                    ...i,
                    count,
                });
            }
        }


        result.session = {
            dishes: convertDishes,
            date: getDate(date),
            type,
            number,
            hasToChange: false,
            askToChange: false,
        }

        if (type == "table" && sessionId) {
            const check = await checkSession(restaurantId, type, number);

            result.session.askToChange = check.askToChange;
            result.session.hasToChange = check.hasToChange;
        }
        if (!sessionId) {
            result.session.hasToChange = true;
        }
    };


    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, settings: 1, components: { amount: 1, _id: 1 } } });
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

    const user = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions" } }
    ]);

    if (user && user[0]) {
        result.quantity = 0;
        for (let i of user[0].session.dishes) {
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
            .push(getDishPromise(
                restaurantId,
                { _id: id(dishId) },
                {
                    projection: {
                        name: 1,
                        price: 1,
                        image: 1,
                        description: 1
                    }
                }
            ));
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

    const result = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions" } }
    ]);

    if (!result || !result[0]) {
        return res.send(null);
    }

    const s = result[0].session as { dishes: { dishId: ObjectId; _id: ObjectId; comment: string }[]; restaurantId: ObjectId };

    const ids = () => {
        const arr: { dishId: string; quantity: number }[] = [];
        for (let i of s.dishes) {
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
    for (let i of s.dishes) {
        total += (await dishes.get(i.dishId))?.price! / 100;
    }

    res.send({
        total: total.toFixed(2),
        dishes: dishes.table,
        sessionDishes: s.dishes,
        ids: ids(),
    });
});
router.get("/session/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions" } }
    ]);

    if (!result || !result[0]) {
        return res.send(null);
    }

    const s = result[0].session as { dishes: { dishId: ObjectId; _id: ObjectId; comment: string }[]; restaurantId: ObjectId };

    const ids = [];

    for (let i of s.dishes) {
        if (i.dishId.equals(dishId)) {
            ids.push(i);
        }
    }

    res.send(ids);
});
// router.delete("/session/dish/:sessionDishId", async (req, res) => {
//     const { restaurantId, sessionDishId } = req.params as any;

//     const result = await updateUser(req.user as string, {
//         $pull: { "sessions.$[restaurantId].dishes": { _id: id(sessionDishId) } }
//     }, { arrayFilters: [{ 'restaurantId.restaurantId': id(restaurantId) }] });


//     console.log("session dish removed: ", result.modifiedCount > 0);


//     res.send({
//         removed: result.modifiedCount > 0
//     });
// });
// router.post("/session/dish/:sessionDishId/comment", async (req, res) => {
//     const { restaurantId, sessionDishId } = req.params as any;
//     const { comment } = req.body;

//     const result = await updateUser(req.user as string, {
//         $set: { "sessions.$[restaurantId].dishes.$[id].comment": comment }
//     }, { arrayFilters: [{ "restaurantId.restaurantId": id(restaurantId) }, { "id._id": id(sessionDishId) }] })

//     console.log("session dish comment updated: ", result.modifiedCount > 0);

//     res.send({ updated: result.modifiedCount > 0 });
// });


router.get("/session/payment-intent", async (req, res) => {
    const { restaurantId } = req.params as any;


    console.log("CREATING PAYMENT INTENT");


    const user = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions" } }
    ]);

    if (!user || !user[0] || !user[0].session) {
        return res.sendStatus(404);
    }

    const dishes = new DishHashTableUltra(restaurantId, { price: 1 });


    let amount = 0;
    for (let i of user[0].session.dishes) {
        const dish = (await dishes.get(i.dishId));
        console.log(dish);
        if (dish) {
            amount += dish.price!;
        }
    }

    console.log(amount);


    try {
        const result = await stripe.paymentIntents.create(
            {
                amount,
                currency: "usd",
                payment_method_types: ["card"],
            }
        );

        console.log(result);

        res.send(result);
    } catch (err) {
        res.sendStatus(500);
        throw err;
    }


});


export {
    router as OrderRouter
}