import { Router } from "express";
import { DishHashTableUltra } from "../../../utils/dish";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { getUser } from "../../../utils/users";
import { OrderRouter } from "./order";


const router = Router({ mergeParams: true });



router.use("/:orderId", OrderRouter);


interface Dish {
    _id: string;
    orderId: string;
    time: number;
    dishId: string;
}; router.get("/init", async (req, res) => {
    const { restaurantId } = req.params as any;

    const orders = await Orders(restaurantId).many({}, { projection: { ordered: 1, _id: 1, dishes: { status: 1, dishId: 1, _id: 1 } } });

    const dishes = new DishHashTableUltra(restaurantId, { name: 1, image: { binary: 1, resolution: 1, }, time: 1, general: 1 });

    const delayed = [];
    const all: { [key: string]: any[] } = {
        a: [],
        so: [],
        sa: [],
        e: [],
        si: [],
        d: [],
        b: [],
    };

    for (let i of orders.sort((a, b) => a.ordered! - b.ordered!)) {
        for(let d of i.dishes) {
            if(d.status == "cooking" || d.status == "ordered") {
                const dish = await dishes.get(d.dishId);
    
                if (!dish) {
                    console.log("NO DISH ???????????????????????");
                    continue;
                }
        
                const converted = {
                    ...d,
                    orderId: i._id,
                    time: getDelay(i.ordered!)
                };
        
                all[dish.general!].push(converted);
                delayed.push(converted);
            }
        }
    }

    console.log(all);
    

    res.send({ delayed: delayed, allDishes: all, dishes: dishes.table });
});

interface Taken {
    time: {
        hours: number;
        minutes: number;
        nextMinute: number;
        color: string;
    };
    user: {
        avatar: any;
        name: string;
        _id: string;
    }
}; router.get("/taken", async (req, res) => {

    const user = await getUser(req.user as string, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });
    
    const result: Taken = {
        time: { hours: 0, minutes: 0, nextMinute: 59500, color: "green" },
        user: {
            name: user.name! || user.username!,
            avatar: user.avatar?.binary,
            _id: req.user as string,
        }
    };


    res.send(result);
});

router.get("/delayed", async (req, res) => {
    const { restaurantId } = req.params as any;

    const allOrderDishes: Dish[] = (await Orders(restaurantId).aggregate([
        { $unwind: "$orders" },
        { $unwind: "$orders.dishes" },
        {
            $project: {
                orderId: "$orders._id",
                dishId: "$orders.dishes.dishId",
                _id: "$orders.dishes._id",
                time: "$orders.time",
                taken: "$orders.dishes.taken",
            }
        },
    ]) as Dish[]);


    res.send(allOrderDishes.sort((a, b) => a.time - b.time).splice(0, 4));
});

router.get("/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, time: 1, image: { binary: 1 } } });

    res.send(result);
});






export {
    router as KitchenRouter,
}