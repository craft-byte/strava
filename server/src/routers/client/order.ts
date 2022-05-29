import { Router } from "express";
import { ObjectId } from "mongodb";
import { stripe } from "../..";
import { DishHashTableUltra, getDishes, getDishPromise } from "../../utils/dish";
import { id, log } from "../../utils/functions";
import { convertDishes, getCategory } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";
import { aggregateUser, getUser, updateUser } from "../../utils/users";


const router = Router({ mergeParams: true });


router.get("/authenticate", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1 } });

    res.send(restaurant);
});
router.get("/init", async (req, res) => {
    const { restaurantId } = req.params as any;


    const beverages = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "b", "image.resolution": 1 },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const entrees = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "e", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const deserts = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "d", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const appetizers = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "a", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const soups = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "so", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const sides = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "si", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );
    const salads = convertDishes(
        await Restaurant(restaurantId).dishes.many(
            { general: "sa", "image": { $exists: true } },
            {
                limit: 4,
                projection: {
                    name: 1,
                    image: { binary: 1, resolution: 1 },
                    price: 1,
                    time: 1,
                    general: 1
                }
            }
        )
    );



    res.send({ beverages, entrees, deserts, appetizers, soups, sides, salads });
});
router.get("/dishesByType/:type", async (req, res) => {
    const { restaurantId, type } = req.params as any;

    const foundDishes = await getDishes(
        restaurantId,
        {
            categories: type
        },
        {
            projection: {
                name: 1,
                image: 1,
                price: 1,
                time: 1,
                categories: 1,
            }
        }
    )

    const dishes = convertDishes(foundDishes);

    res.send(dishes);
});
router.get("/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const convert = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1, categories: 1, image: 1, time : 1 } });

    if(!convert) {
        return res.sendStatus(404);
    }

    
    const result: any = {
        name: convert.name,
        category: getCategory(convert!.categories![0]),
        price:  (convert.price! / 100).toFixed(2),
        image: convert.image,
        time: convert.time,
        _id: convert._id
    };
    
    const user = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions" } }
    ]);

    if(user && user[0]) {
        result.quantity = 0;
        for(let i of user[0].session.dishes) {
            if(i.dishId.equals(dishId)) {
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

    if(!result || !result[0]) {
        return res.send(null);
    }

    const s = result[0].session as { dishes: {dishId: ObjectId; _id: ObjectId; comment: string}[]; restaurantId: ObjectId };

    const ids = () => {
        const arr: { dishId: string; quantity: number }[] = [];
        for(let i of s.dishes) {
            let add = true;
            for(let j of arr) {
                if(i.dishId.equals(j.dishId)) {
                    j.quantity++;
                    add = false;
                }
            }
            if(add) {
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
    for(let i of s.dishes) {
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

    if(!result || !result[0]) {
        return res.send(null);
    }

    const s = result[0].session as { dishes: {dishId: ObjectId; _id: ObjectId; comment: string}[]; restaurantId: ObjectId };

    const ids = [];

    for(let i of s.dishes) {
        if(i.dishId.equals(dishId)) {
            ids.push(i);
        }
    }

    res.send(ids);
});
router.delete("/session/dish/:sessionDishId", async (req, res) => {
    const { restaurantId, sessionDishId } = req.params as any;

    const result = await updateUser(req.user as string, {
        $pull: { "sessions.$[restaurantId].dishes": { _id: id(sessionDishId) } }
    }, { arrayFilters: [ { 'restaurantId.restaurantId': id(restaurantId) } ] });


    console.log("session dish removed: ", result.modifiedCount > 0);


    res.send({
        removed: result.modifiedCount > 0
    });
});
router.post("/session/dish/:sessionDishId/comment", async (req, res) => {
    const{ restaurantId, sessionDishId } = req.params as any;
    const { comment } = req.body;

    const result = await updateUser(req.user as string, {
        $set: { "sessions.$[restaurantId].dishes.$[id].comment": comment }
    }, { arrayFilters: [{ "restaurantId.restaurantId": id(restaurantId) }, { "id._id": id(sessionDishId) }] })

    console.log("session dish comment updated: ", result.modifiedCount > 0);

    res.send({updated: result.modifiedCount > 0});
});


router.get("/session/payment-intent", async (req, res) => {
    const { restaurantId } = req.params as any;

    
    
    const user = await aggregateUser([
        { $match: { _id: id(req.user as string) } },
        { $unwind: "$sessions" },
        { $match: { "sessions.restaurantId": id(restaurantId) } },
        { $project: { session: "$sessions"} }
    ]);
    
    if(!user || !user[0] || !user[0].session) {
        return res.sendStatus(404);
    }
    
    const dishes = new DishHashTableUltra(restaurantId, { projection: { price: 1 } });
    

    let amount = 0;
    for(let i of user[0].session.dishes) {
        const dish = (await dishes.get(i.dishId));
        console.log(dish);
        if(dish) {
            amount += dish.price!;
        }
    }

    console.log(amount);


    try {
        const result = await stripe.paymentIntents.create(
            {
              amount: amount,
              currency: "usd",
              payment_method_types: ["card"],
            }
        );

        console.log(result);

        res.sendStatus(201).send(result);
    } catch (err) {
        res.sendStatus(500);
        throw err;
    }


});


export {
    router as OrderRouter
}