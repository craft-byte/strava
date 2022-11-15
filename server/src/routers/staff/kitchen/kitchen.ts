import { Router } from "express";
import { io } from "../../..";
import { DishHashTableUltra } from "../../../utils/dish";
import { id } from "../../../utils/functions";
import { logged } from "../../../utils/middleware/logged";
import { allowed } from "../../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { OrderRouter } from "./order";


const router = Router({ mergeParams: true });



router.use("/order/:orderId", OrderRouter);


interface Dish {
    _id: string;
    orderId: string;
    time: number;
    dishId: string;
}; router.post("/init", logged({ _id: 1 }), allowed({}, "cook"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;

    if(!socketId) {
        console.log("NO SOCKET ID: DANGER");
    } else {
        io.in(socketId).socketsJoin(`${restaurantId}/kitchen`);
    }

    const orders = await Orders(restaurantId).many({ status: "progress" }, { projection: { ordered: 1, _id: 1, dishes: { status: 1, takenBy: 1, dishId: 1, _id: 1 } } });


    const dishes = new DishHashTableUltra(restaurantId, { name: 1, image: { binary: 1, resolution: 1, }, info: { time: 1 }, general: 1 });

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
    
                
                const converted = {
                    ...d,
                    orderId: i._id,
                    time: getDelay(i.ordered!),
                    taken: d.takenBy,
                };
                
                if (dish) {
                    console.log("NO DISH ???????????????????????");
                    all[dish.general!].push(converted);
                }
                if(d.status == "ordered") {
                    delayed.push(converted);
                }
            }
        }
    }
    

    res.send({ delayed: delayed, allDishes: all, dishes: dishes.table });
});


router.get("/dishes", logged({ _id: 1, }), allowed({}, "cook"), async (req, res) => {
    const { restaurantId } = req.params;

    const orders = await Orders(restaurantId).many({ status: "progress" }, { projection: { ordered: 1, _id: 1, dishes: { status: 1, takenBy: 1, dishId: 1, _id: 1 } } });


    
    const ids = new Set<string>();
    
    const delayed = [];
    const all = [];
    
    for (let i of orders.sort((a, b) => a.ordered! - b.ordered!)) {
        for(let d of i.dishes) {
            if(d.status == "cooking" || d.status == "ordered") {
                ids.add(d.dishId.toString());
                
                const converted = {
                    ...d,
                    orderId: i._id,
                    time: getDelay(i.ordered!),
                    taken: d.takenBy,
                };
                
                all.push(converted);
                if(d.status == "ordered") {
                    delayed.push(converted);
                }
            }
        }
    }
    
    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(i => id(i)) } }).get({ projection: { name: 1, image: { binary: 1, resolution: 1, }, info: { time: 1 }, general: 1 } });

    const ds = new DishHashTableUltra(restaurantId, { name: 1, image: { binary: 1, resolution: 1, }, info: { time: 1 }, general: 1 });
    ds.add(dishes);
    
    res.send({ all, dishes: ds.table, delayed });
});




export {
    router as KitchenRouter,
}