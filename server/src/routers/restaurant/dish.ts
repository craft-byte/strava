import { Router } from "express";
import { ObjectId } from "mongodb";
import { Dish } from "../../models/general";
import { Locals } from "../../models/other";
import { getDate, id } from "../../utils/functions";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { bufferFromString } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";
import { Orders } from "../../utils/orders";
import { getUser } from "../../utils/users";


const router = Router({ mergeParams: true });




/**
 * 
 * used in dish-full.page
 * 
 * @returns full dish
 */
router.get("/", logged({}), allowed({ _id: 1 }, { restaurant: { dishes: true } }), async (req, res) => {
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

    if(result.image && result.image.modified) {
        result.image!.modified.date = getDate(result.image!.modified.date!) as any;
        const user = await getUser(result.image.modified.userId, { projection: { name: 1 } });
        
        (result.image.modified as any).user = { name: user?.name?.first, _id: user?._id } as any;
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
router.post("/", logged({ _id: 1 }), allowed({ _id: 1 }, { restaurant: { dishes: true } }), async (req, res) => {
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



    const result = await Restaurant(restaurantId).dishes.one(dishId).update({ $set: update as any });

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
router.delete("/", logged({ _id: 1, }), allowed({ _id: 1 }, { restaurant: { dishes: true } }), async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1 } });

    if(!dish) {
        return res.status(404).send({ reason: "NoDishFound" });
    }

    const result = await Restaurant(restaurantId).dishes.one(dishId).remove();

    console.log("dish removed: ", result.deletedCount > 0);

    res.send({ removed: result.deletedCount > 0 });


    const ordersUpdate = await Orders(restaurantId).update(
        { dishes: { $elemMatch: { dishId: id(dishId) } } },
        { $set: {
            "dishes.$[dish].name": dish.name,
            "dishes.$[dish].price": dish.price,
        } },
        { arrayFilters: [ { "dish.dishId": id(dishId) } ] }
    );
});







router.get("/analytics", logged({ _id: 1, }), allowed({ _id: 1, }, { restaurant: { dishes: true } }), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { dishId } = req.params;

    // day in milliseconds
    const day = 86_400_000;
    
    // last week, last 7 days
    const week = new Date(Date.now() - day * 7)
    week.setHours(0, 0, 0);

    // last month, last 30 days
    const month = new Date(Date.now() - day * 30);
    month.setHours(0, 0, 0);

    const orders = await Orders(restaurant._id).history.many(
        { ordered: { $gt: month.getTime() }, dishes: { $elemMatch: { dishId: id(dishId) } } },
        { projection: { _id: 1, type: 1, ordered: 1, dishes: { dishId: 1, removed: 1 } } }
    ).toArray();


    const result = {
        boughtWeek: 0,
        boughtMonth: 0,
        type: {
            weekDinein: 0,
            weekTakeout: 0,
            monthDinein: 0,
            monthTakeout: 0,
        },
        week: <{ [dayName: string]: number }>{ },
        month: <{ [date: string]: number }>{ },
    }

    for(let order of orders) {

        // get weekday name: "Mon", "Wed", "Fri"
        const dayName = weekday(order.ordered!);
        const date = Intl.DateTimeFormat("en-CA", { day: "2-digit" }).format(order.ordered);

        // if result.week[dayName] exists leave it like that, else make it 0
        result.week[dayName] = result.week[dayName] || 0;

        // if result.month[date] exists leave it like that, else make it 0
        result.month[date] = result.month[date] || 0;

        if(order.type == "dinein") {
            // if the order was ordered within last week
            if(order.ordered! > week.getTime()) {
                result.type.monthDinein++;
            }

            // if the order was ordered within last month
            if(order.ordered! > month.getTime()) {
                result.type.monthDinein++;
            }
        } else if(order.type == "takeout") {
            // if the order was ordered within last week
            if(order.ordered! > week.getTime()) {
                result.type.monthTakeout++;
            }

            // if the order was ordered within last month
            if(order.ordered! > month.getTime()) {
                result.type.monthTakeout++;
            }
        }

        // find dish with the right id
        for(let dish of order.dishes) {
            if(dish.dishId.equals(dishId)) {

                // if the order was ordered within last week
                if(order.ordered! > week.getTime()) {
                    result.boughtWeek ++;
                    result.week[dayName]++;
                }

                // if the order was ordered within last month
                if(order.ordered! > month.getTime()) {
                    result.boughtMonth ++;
                    result.month[date]++;
                }
            }
        }
    }



    res.send({
        boughtWeek: result.boughtWeek,
        boughtMonth: result.boughtMonth,
        month: convertMonth(result.month),
        week: convertWeek(result.week),
        weekType: [
            {
                name: "Dine-in",
                value: result.type.weekDinein,
            },
            {
                name: "Take out",
                value: result.type.weekTakeout,
            }
        ],
        monthType: [
            {
                name: "Dine-in",
                value: result.type.monthDinein,
            },
            {
                name: "Take out",
                value: result.type.monthTakeout,
            }
        ]
    });


    setDishRating(restaurant._id, dishId, result.boughtWeek / Object.keys(result.week).length, null!);
});



function convertWeek(obj: { [key: string]: number; }) {    
    const result = [];

    for(let date of Object.keys(obj)) {
        result.push({
            name: date,
            value: obj[date],
        });
    }


    return result;
}
function convertMonth(obj: { [key: string]: number; }) {    
    const result = [];

    for(let i = +Object.keys(obj)[0]; i < +Object.keys(obj)[Object.keys(obj).length - 1]; i++) {
        if(!obj[i]) {
            obj[i] = 0;
        }
    }

    for(let date of Object.keys(obj)) {
        result.push({
            name: date,
            value: obj[date],
        });
    }


    return result;
}

function weekday(time: number) {
    const date = new Date(time);

    // Get the day of the week as a number (0-6)
    const dayOfWeek = date.getDay();

    // Define an array of weekday names
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get the name of the weekday
    return weekdays[dayOfWeek];
}



async function setDishRating(
    restaurantId: ObjectId,
    dishId: string,
    avgBoughtPerDay: number,
    avgCustomerRating: number,
) {


    if(!avgCustomerRating) {
        return;
    }

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { price: 1, info: { time: 1, } } });

    if(!dish || !dish.price || !dish.info?.time) {
        return;
    }


    const rating = avgBoughtPerDay * avgCustomerRating / dish.price * dish.info.time;

    await Restaurant(restaurantId).dishes.one(dishId).update({ $set: { "info.rating": rating } })
}


export {
    router as DishRouter,
}

