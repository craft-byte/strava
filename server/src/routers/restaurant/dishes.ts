import { Router } from "express";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { getDate, id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { Dish } from "../../models/general";
import { bufferFromString } from "../../utils/other";
import { DishRouter } from "./dish";
import { logged } from "../../utils/middleware/logged";
import { Locals } from "../../models/other";

const router = Router({ mergeParams: true });



router.use("/:dishId", DishRouter);


/**
 * @returns first 10 dishes of restaurant
 */
router.get("/", logged({ _id: 1 }), allowed({ _id: 1 }, { restaurant: { dishes: true } }), async (req, res) => {
    const { restaurantId } = req.params;

    const dishes = await Restaurant(restaurantId).dishes.many({ }).get({ limit: 10, projection: { name: 1, info: { modified: 1, bought: 1 }, price: 1, } });

    const result = [];

    for(let i of dishes) {
        result.push({
            _id: i._id,
            name: i.name,
            modified: getDate(i.info.modified!.date),
            price: i.price,
            bought: i.info.bought
        });
    }

    res.send(result);
});



/**
 * creates dish
 * 
 * @param { name: stirng;
 *          image: { binary: string; resolution: number; };
 *          price: number;
 *          description: string;
 *          category: string;
 *          time: number; } dish
 * 
 * @returns { added: boolean; }
 * 
 * @throws { status: 422; reason: "InvalidDishName" } - dish name is invalid or not provided
 * @throws { status: 422; reason: "InvalidDishPrice" } - dish price is invalid or not provided
 * @throws { status: 422; reason: "InvalidDishTime" } - dish time is invalid or not provided
 * @throws { status: 422; reason: "InvalidDishDescription" } - dish description is invalid
 * @throws { status: 422; reason: "InvalidDishCategory" } - dish category is invalid or not provided
 */
router.post("/", logged({ _id: 1 }), allowed({  }, { restaurant: { dishes: true } }), async (req, res) => {
    const { restaurantId } = req.params;
    const { name, price, image, description, time, category } = req.body;
    const { user } = res.locals as Locals;


    if(!name || name.length > 30) {
        return res.status(422).send({ reason: "InvalidDishName" });
    } else if(!price || typeof price != "number" || price < 100) {
        return res.status(422).send({ reason: "InvalidDishPrice" });
    } else if(image && (!image.binary || !image.resolution || typeof image.resolution != "number")) {
        return res.status(422).send({ reason: "InvalidDishImage" });
    } else if(time && typeof time != "number") {
        return res.sendStatus(422).send({ reason: "InvalidTime" });
    } else if(description && typeof description != "string") {
        return res.sendStatus(422).send({ reason: "InvalidDescription" });
    } else if(!category || typeof category != "string" || !["a", "so", "sa", "e", "si", "d", "b"].includes(category)) {
        return res.sendStatus(422).send({ reason: "InvalidCategory" });
    }
    

    const newDish: Dish = {
        name: name,
        price: price,
        cooking: { components: [], cooks: [], recipee: null!, modified: { date: null!, userId: null!, } },
        _id: id(),
        description,
        general: category,
        info: {
            bought: 0,
            time,
            liked: 0,
            created: { date: Date.now(), userId: user._id },
            modified: { date: Date.now(), userId: user._id },
        }
    };

    if(image) {
        newDish.image = {
            binary: bufferFromString(image.binary),
            modified: {
                date: Date.now(),
                userId: user._id,
            },
            resolution: image.resolution
        };
    }

    const result = await Restaurant(restaurantId).dishes.add(newDish);

    console.log('dish added: ', result.acknowledged);

    res.send({ added: result.acknowledged });
});



/**
 * 
 * @param { string } searchText - req.body.searchText - search text
 *
 * @returns { dishes } - found dishes
 */
router.patch("/find", logged({ _id: 1 }), allowed({ _id: 1 }, { restaurant: { dishes: true } }), async (req, res) => {
    const { searchText } = req.body;
    const { restaurant, } = res.locals as Locals;
    
    const dishesNames = await Restaurant(restaurant._id).dishes.many({}).get({ projection: { name: 1 } });
    
    if(!dishesNames || dishesNames.length == 0) {
        return res.send([]);
    }

    const ids = new Set<string>();

    for (let { name: n, _id } of dishesNames) {
        for(let i = 0; i < n!.length - searchText.length + 1 ;i ++) {
            if (n!.substring(i, searchText.length + i).toLowerCase() === searchText.toLowerCase()) {
                ids.add(_id.toString());
            }
        }
    }

    const dishes = await Restaurant(restaurant._id).dishes.many({ _id: { $in: Array.from(ids).map(i => id(i)), } }).get({ projection: { name: 1, info: { modified: 1, bought: 1 }, price: 1, } })

    const result = [];

    for(let i of dishes) {
        result.push({
            _id: i._id,
            name: i.name,
            modified: getDate(i.info.modified!.date),
            price: i.price,
            bought: i.info.bought
        });
    }

    
    res.send(result);
});


export {
    router as DishesRouter
}