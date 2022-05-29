import { Router } from "express";
import { getDish, getDishes } from "../../../utils/dish";
import { log } from "../../../utils/functions";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { sortDishesForKitchen, sortQuantity } from "./functions";


const router = Router({ mergeParams: true });



router.get("/init", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1 } });

    if (!restaurant) {
        return res.send({ error: "restaurant" });
    }

    const orders = await Orders(restaurantId).all();

    const { convertedDishes, categories } = (await sortDishesForKitchen(restaurantId, orders!));
    
    res.send({
        restaurant,
        dishes: categories(),
        convertedDishes,
        userId: req.user
    });
});
router.get("/dishes/sort/:orderId", async (req, res) => {
    const { restaurantId, orderId } = <{ restaurantId: string; orderId: string }>req.params;

    const order = await Orders(restaurantId).one(orderId).get();

    if (!order) {
        log("ERROR", "no order at /dishes/sort/:orderId");
        return res.send([]);
    }

    const dishes = (await sortDishesForKitchen(restaurantId, [order])).categories();

    res.send(dishes);
});
router.get("/dishes/all", async (req, res) => {
    const { restaurantId } = req.params as any;

    const orders = await Orders(restaurantId).all();

    const dishes = (await sortDishesForKitchen(restaurantId, orders!)).categories();

    res.send(dishes);
});
router.get("/dish/:dishId", async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { image: 1, name: 1, time: 1 } });

    res.send(result);
});
router.post("/dishes/convert", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { dishes } = req.body;

    if (!dishes || dishes.length == 0) {
        return res.send(null);
    }

    const ids: string[] = [];

    for (let { dishId } of dishes) {
        ids.push(dishId);
    }

    const idsSorted = sortQuantity(ids);


    const dishesFound = await getDishes(
        restaurantId,
        { _id: { $in: idsSorted.ids } },
        {
            projection: {
                image: 1,
                name: 1,
                time: 1
            }
        }
    );

    const result: any = {};

    for (let dish of dishesFound) {
        result[dish._id.toString()] = {
            ...dish,
            time: `${dish.time} min`
        };
    }

    res.send(result);
});
router.get("/dishes/cooking/:dishId", async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const dish = await getDish(restaurantId, dishId, { projection: { cooking: 1 } });

    if (!dish) {
        return res.sendStatus(404);
    }

    if (dish.cooking) {
        const result: any = {
            components: []
        };

        const restaurant = await Restaurant(restaurantId).get({ projection: { components: 1 } });

        if (!restaurant) {
            return res.sendStatus(404);
        }

        for (let i of dish.cooking.components) {
            for (let c of restaurant.components!) {
                if (i._id.toString() == c._id?.toString()) {
                    result.components.push({
                        name: c.name,
                        amount: i.amount,
                        has: c.amount,
                        color: c.amount! < i.amount ? "red" : "black"
                    });
                    break;
                }
            }
        }

        result.recipee = dish.cooking.recipee;

        return res.send(result);
    }

    res.send(null);
});
router.get("/dishes/details/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, image: 1 } });

    res.send(result);
});





export {
    router as KitchenRouter,
}