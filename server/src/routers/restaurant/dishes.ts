import { Router } from "express";
import { client, upload } from "../..";
import { allowed } from "../../middleware/restaurant";
import { getDate, id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { Dish } from "../../models/general";
import { findDishes } from "../../utils/dish";
import { bufferFromString, getIds } from "../../utils/other";
import { sequenceEqual } from "rxjs";
import { ObjectId } from "mongodb";
import { resolveContent } from "nodemailer/lib/shared";

const router = Router({ mergeParams: true });




router.get("/", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId } = req.params;

    const dishes = await Restaurant(restaurantId).dishes.many({ }, { limit: 10, projection: { name: 1, modified: 1, price: 1, bought: 1 } });

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
        _id: id(),
    };

    const result = await Restaurant(restaurantId).dishes.add(newDish);

    console.log('dish added: ', result.acknowledged);

    res.send({ added: result.acknowledged });
});
router.delete("/:dishId", allowed("manager", "dishes", "remove"), async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).remove();

    console.log("dish removed: ", result.deletedCount > 0);

    res.send({ removed: result.deletedCount > 0 });
});
router.get("/:dishId", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;
    

    const result = await Restaurant(restaurantId)
        .dishes.one(dishId).get(
            {
                projection: { name: 1, image: { binary: 1, resolution: 1, modified: 1 }, price: 1, time: 1, description: 1, cooking: 1, general: 1, strict: 1, categories: 1 }
            }
        );

    if (!result) {
        return res.send(null);
    }

    result.price = result.price! / 100;
    if (result.cooking) {
        const components = await Restaurant(restaurantId).components.getMany(getIds(result.cooking!.components), { _id: 1, name: 1, amount: 1});
        if (components) {
            const finalComponents: any = [];
            for (let i in components) {
                finalComponents.push({
                    _id: components[i]._id!,
                    name: components[i].name!,
                    amount: result.cooking!.components[i].amount
                } as any);
            }
            result.cooking!.components = finalComponents;
        }
    }

    res.send(result);
});
router.patch("/:dishId", allowed("manager", "dishes", "add"), async (req, res) => {
    const { restaurantId, dishId } = req.params;

    if(req.body.image) {
        req.body.image.modified = new Date();
        req.body.image.binary = bufferFromString(req.body.image.data);
        delete req.body.image.data;
    }

    req.body.mofidied = new Date();
    req.body.price *= 100;

    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: req.body });

    console.log("dish updated: ", result.modifiedCount > 0);

    res.send({ updated: result.modifiedCount > 0 });
});
router.get("/:dishId/cooking", allowed("manager", "dishes", "cooking"), async (req, res) => {
    const { restaurantId, dishId } = req.params;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { cooking: 1, name: 1 } });

    if(!result) {
        return res.sendStatus(404);
    }

    
    const components = await Restaurant(restaurantId).components.getAll({ name: 1, _id: 1 });
    
    let cooking: any = null;
    if(result.cooking) {
        cooking = {};
        cooking.recipee = result.cooking.recipee;
        if(result.cooking.components) {
            cooking.components = [];
            const getComponent = (id: ObjectId) => {
                for(let i of components!) {
                    if(i._id!.equals(id)) {
                        return i;
                    }
                }
            }
            for(let i of result.cooking.components) {
                const cmp = getComponent(i._id);
                cooking.components.push({ name: cmp?.name, amount: i.amount, _id: cmp?._id });
            }
        }
    }

    delete result.cooking;

    res.send({ cooking, dish: result, components });
});
router.post("/:dishId/:cooking", allowed("manager", "dishes", "cooking"), async (req, res) => {
    const { dishId, restaurantId } = req.params;
    const { components, recipee } = req.body;

    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: { "cooking.components": components, "cooking.recipee": recipee } });

    console.log("cooking set", result.modifiedCount > 0);

    res.send({ updated: result.modifiedCount > 0 });
});



router.get("/overview/:time", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId, time } = req.params as any;

    const result = await Restaurant(restaurantId)
        .dishes.many(
            {},
            {
                limit: (+time + 1) * 7,
                projection: {
                    name: 1,
                    price: 1,
                    created: 1,
                }
            }
        );

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
router.post("/", allowed("manager", "dishes", "add"), async (req, res) => {
    const { restaurantId } = req.params;

    req.body.image.date = new Date();

    req.body.image.data = bufferFromString(req.body.image.data);

    const newDish: Dish = {
        ...req.body,
        bought: 0,
        liked: 0,
        choosen: false,
        dates: [],
        sale: null,
        created: new Date(),
        sales: [],
        prices: [],
        _id: id()
    };


    const result = await Restaurant(restaurantId).dishes.add(newDish);

    console.log("added dish: ", result.acknowledged);

    res.send(result);
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