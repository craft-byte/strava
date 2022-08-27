import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../middleware/restaurant";
import { id } from "../../utils/functions";
import { bufferFromString, getIds } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });



router.delete("/", allowed("manager", "dishes"), async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).remove();

    console.log("dish removed: ", result.deletedCount > 0);

    res.send({ removed: result.deletedCount > 0 });
});
router.get("/", allowed("manager", "dishes"), async (req, res) => {
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
router.post("/", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId, dishId } = req.params;

    const update: any = {
        modified: {
            date: new Date(),
            user: req.user,
        },
    };

    if(req.body.image) {
        update.image = {
            modified: new Date(),
            binary: bufferFromString(req.body.image.data),
            resolution: req.body.image.resolution,
        }
    }
    if(req.body.price) {
        if(typeof req.body.price == "number") {
            update.price = req.body.price * 100;
        }
    }
    if(req.body.time) {
        if(typeof req.body.time == "number") {
            update.time = req.body.time;
        }
    }
    if(req.body.name) {
        update.name = (req.body.name as string).trim();
    }
    if(req.body.desctiprion) {
        update.description = (req.body.description as string).trim();
    }
    if(req.body.categories) {
        update.categories = req.body.categories;
    }
    if(req.body.strict) {
        update.strict = req.body.strict;
    }
    if(req.body.general) {
        update.general = req.body.general;
    }
    

    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: update });

    console.log("dish updated: ", result.modifiedCount > 0);

    res.send({ updated: result.modifiedCount > 0 });
});
router.get("/cooking", allowed("manager", "dishes"), async (req, res) => {
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

    res.send({ cooking, dish: result });
});



router.post("/cooking/component", allowed("manager", "dishes"), async (req, res) => {
    const { dishId, restaurantId } = req.params;
    const { amount, componentId } = req.body;

    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $push: { "cooking.components": { _id: id(componentId), amount, added: new Date(), modified: new Date() } } });

    res.send({ updated: result.modifiedCount > 0 });
});
router.delete("/cooking/component/:componentId", allowed("manager", "dishes"), async (req, res) => {
    const { restaurantId, dishId, componentId } = req.params;

    const update = await Restaurant(restaurantId).dishes.one(dishId).update({ $pull: { "cooking.components": { _id: id(componentId) } } });

    res.send({ removed: update.modifiedCount > 0 });
});
router.patch("/cooking/component/:componentId", allowed("manager", "dishes"), async (req, res) => {
    const { dishId, restaurantId, componentId } = req.params;
    const { amount } = req.body;

    const result = await Restaurant(restaurantId).dishes.one(dishId).update(
        { $set: { "cooking.components.$[componentId].amount": amount } },
        { arrayFilters: [ { "componentId._id": id(componentId) } ] }
    );

    res.send({ updated: result.modifiedCount > 0 });
});


router.post("/cooking/recipee", allowed("manager", "dishes"), async (req, res) => {
    const { recipee } = req.body;
    const { dishId, restaurantId } = req.params;

    const update = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: { "cooking.recipee": (recipee as string).trim() } })

    res.send({ updated: update.modifiedCount > 0 });
});




export {
    router as DishRouter,
}