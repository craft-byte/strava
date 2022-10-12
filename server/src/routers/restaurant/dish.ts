import { Router } from "express";
import { ObjectId } from "mongodb";
import { Dish } from "../../models/general";
import { Locals } from "../../models/other";
import { id } from "../../utils/functions";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { bufferFromString } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });




/**
 * 
 * used in dish-full.page
 * 
 * @returns full dish
 */
router.get("/", logged({}), allowed({ _id: 1 }, "manager", "dishes"), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;





    const result = await Restaurant(restaurantId)
        .dishes.one(dishId).get(
            {
                projection: { name: 1, image: { binary: 1, resolution: 1, modified: 1 }, price: 1, info: { time: 1 }, description: 1, general: 1, }
            }
        );

    if (!result) {
        return res.sendStatus(404);
    }

    res.send(result);
});


interface DishUpdate {
    name?: string;
    price?: number;
    general?: string;
    image?: { binary: any; resolution: 1.77 | 1 | 1.33; modified: { date: number; userId: ObjectId; } };
    description?: string;
    "info.modified": {
        date: number;
        userId: ObjectId;
    };
    "info.time"?: number;
};
/**
 * @param { name?: stirng;
 *          image?: { binary: string; resolution: number; };
 *          price?: number;
 *          description?: string;
 *          category?: string;
 *          time?: number; } body
 * 
 * @returns { updated: boolean; }
 * 
 * @throws { status: 422; reason: "InvalidDishName" } - dish name is invalid
 * @throws { status: 422; reason: "InvalidDishPrice" } - dish price is invalid
 * @throws { status: 422; reason: "InvalidDishTime" } - dish time is invalid
 * @throws { status: 422; reason: "InvalidDishDescription" } - dish description is invalid
 * @throws { status: 422; reason: "InvalidDishCategory" } - dish category is invalid
 *
 *
 */
router.post("/", logged({ _id: 1 }), allowed({ _id: 1 }, "manager", "dishes"), async (req, res) => {
    const { restaurantId, dishId } = req.params;
    const { user } = res.locals as Locals;
    const { price, name, time, image, category, description } = req.body;


    const update: DishUpdate = {
        "info.modified": {
            date: Date.now(),
            userId: user._id!,
        }

    };

    if (name) {
        if (typeof name != "string") {
            return res.status(422).send({ reason: "InvalidDishName" });
        }
        update.name = name;
    }
    if (price) {
        if (typeof price != "number" || price < 100) {
            return res.status(422).send({ reason: "InvalidDishPrice" });
        }
        update.price = price;
    }
    if (time) {
        if (typeof time != "number") {
            return res.status(422).send({ reason: "InvalidDishTime" });
        }
        update["info.time"] = time;
    }
    if (category) {
        if (typeof category != "string" || !["a", "so", "sa", "e", "si", "d", "b"].includes(category)) {
            return res.status(422).send({ reason: "InvalidDishCategory" });
        }
        update.general = category;
    }
    if (image) {
        if (!image.resolution || !image.binary || typeof image.binary != "string" || typeof image.resolution != "number" || ![1.77, 1, 1.33].includes(image.resolution)) {
            return res.status(422).send({ reason: "InvalidDishImage" });
        }
        update.image = {
            binary: bufferFromString(image.binary),
            resolution: image.resolution,
            modified: {
                userId: user._id,
                date: Date.now()
            }
        }
    }
    if (description) {
        if (typeof description != "string") {
            return res.status(422).send({ reason: "InvalidDishDescription" });
        }
        update.description = description;
    }



    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: update });

    console.log("dish updated: ", result.modifiedCount > 0);

    res.send({ updated: result.modifiedCount > 0 });
});



/**
 * 
 * removes dish
 * 
 * @returns { removed: boolean; }
 * 
 */
router.delete("/", logged({ _id: 1, }), allowed({ _id: 1 }, "manager", "dishes"), async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).remove();

    console.log("dish removed: ", result.deletedCount > 0);

    res.send({ removed: result.deletedCount > 0 });
});




// router.get("/cooking", allowed({}, "manager", "dishes"), async (req, res) => {
//     const { restaurantId, dishId } = req.params;

//     const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { cooking: 1, name: 1 } });

//     if(!result) {
//         return res.sendStatus(404);
//     }


//     const components = await Restaurant(restaurantId).components.getAll({ name: 1, _id: 1 });

//     let cooking: any = null;
//     if(result.cooking) {
//         cooking = {};
//         cooking.recipee = result.cooking.recipee;
//         if(result.cooking.components) {
//             cooking.components = [];
//             const getComponent = (id: ObjectId) => {
//                 for(let i of components!) {
//                     if(i._id!.equals(id)) {
//                         return i;
//                     }
//                 }
//             }
//             for(let i of result.cooking.components) {
//                 const cmp = getComponent(i._id);
//                 cooking.components.push({ name: cmp?.name, amount: i.amount, _id: cmp?._id });
//             }
//         }
//     }

//     delete result.cooking;

//     res.send({ cooking, dish: result });
// });



// router.post("/cooking/component", allowed("manager", "dishes"), async (req, res) => {
//     const { dishId, restaurantId } = req.params;
//     const { amount, componentId } = req.body;

//     const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $push: { "cooking.components": { _id: id(componentId), amount, added: new Date(), modified: new Date() } } });

//     res.send({ updated: result.modifiedCount > 0 });
// });
// router.delete("/cooking/component/:componentId", allowed("manager", "dishes"), async (req, res) => {
//     const { restaurantId, dishId, componentId } = req.params;

//     const update = await Restaurant(restaurantId).dishes.one(dishId).update({ $pull: { "cooking.components": { _id: id(componentId) } } });

//     res.send({ removed: update.modifiedCount > 0 });
// });
// router.patch("/cooking/component/:componentId", allowed("manager", "dishes"), async (req, res) => {
//     const { dishId, restaurantId, componentId } = req.params;
//     const { amount } = req.body;

//     const result = await Restaurant(restaurantId).dishes.one(dishId).update(
//         { $set: { "cooking.components.$[componentId].amount": amount } },
//         { arrayFilters: [ { "componentId._id": id(componentId) } ] }
//     );

//     res.send({ updated: result.modifiedCount > 0 });
// });


// router.post("/cooking/recipee", allowed("manager", "dishes"), async (req, res) => {
//     const { recipee } = req.body;
//     const { dishId, restaurantId } = req.params;

//     const update = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: { "cooking.recipee": (recipee as string).trim() } })

//     res.send({ updated: update.modifiedCount > 0 });
// });




export {
    router as DishRouter,
}