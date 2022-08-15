import { Router } from "express";
import { allowed } from "../../middleware/restaurant";
import { getDate, id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { Dish } from "../../models/general";
import { findDishes } from "../../utils/dish";
import { bufferFromString, getIds } from "../../utils/other";
import { DishRouter } from "./dish";

const router = Router({ mergeParams: true });



router.use("/:dishId", DishRouter);


router.get("/", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId } = req.params;

    const dishes = await Restaurant(restaurantId).dishes.many({ }).get({ limit: 10, projection: { name: 1, modified: 1, price: 1, bought: 1 } });

    const result = [];

    for(let i of dishes) {
        result.push({
            _id: i._id,
            name: i.name,
            modified: getDate(i.modified!.date),
            price: `$${i.price! / 100}`,
            bought: i.bought
        });
    }

    res.send(result);
});
router.post("/", allowed("manager", "dishes", "add"), async (req, res) => {
    console.log("HELLO?");
    const { restaurantId } = req.params;
    const { dish } = req.body;

    const newDish = {
        ...dish,
        price: dish.price * 100,
        image: {
            binary: bufferFromString(dish.image.binary),
            modified: new Date(),
            user: req.user,
            resolution: dish.image.resolution
        },
        created: { date: new Date(), user: id(req.user as string)! },
        modified: { date: new Date(), user: id(req.user as string)! },
        bought: 0,
        liked: 0,
        cooking: { components: [], recipee: null, modified: { date: null, user: null } },
        _id: id(),
    };

    const result = await Restaurant(restaurantId).dishes.add(newDish);

    console.log('dish added: ', result.acknowledged);

    res.send({ added: result.acknowledged });
});




router.get("/overview/:time", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId, time } = req.params as any;

    const result = await Restaurant(restaurantId)
        .dishes.many(
            {},
        ).get({
            limit: (+time + 1) * 7,
            projection: {
                name: 1,
                price: 1,
                created: 1,
            }
        });

    const dishes = [];

    for (let i of result) {
        dishes.push({
            name: i.name,
            date: i.created,
            price: `$${i.price}`,
            _id: i._id,
        });
    }

    res.send(dishes);
});
router.patch("/find", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { name } = req.body;

    const result = await findDishes(restaurantId, name);

    res.send(result);
});


export {
    router as DishesRouter
}