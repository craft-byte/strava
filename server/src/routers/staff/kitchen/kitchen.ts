import { Router } from "express";
import { io } from "../../..";
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
}; router.post("/init", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;

    if(!socketId) {
        console.log("NO SOCKET ID: DANGER");
    } else {
        io.in(socketId).socketsJoin(`${restaurantId}/kitchen`);
    }

    const orders = await Orders(restaurantId).many({ status: "progress" }, { projection: { ordered: 1, _id: 1, dishes: { status: 1, takenBy: 1, dishId: 1, _id: 1 } } });


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
                    time: getDelay(i.ordered!),
                    taken: d.takenBy,
                };
        
                all[dish.general!].push(converted);
                if(d.status == "ordered") {
                    delayed.push(converted);
                }
            }
        }
    }
    

    res.send({ delayed: delayed, allDishes: all, dishes: dishes.table });
});

// interface Taken {
//     time: {
//         hours: number;
//         minutes: number;
//         nextMinute: number;
//         color: string;
//     };
//     user: {
//         avatar: any;
//         name: string;
//         _id: string;
//     }
// }; router.get("/taken", async (req, res) => {

//     const user = await getUser(req.user as string, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });
    
//     const result: Taken = {
//         time: { hours: 0, minutes: 0, nextMinute: 59500, color: "green" },
//         user: {
//             name: user.name! || user.username!,
//             avatar: user.avatar?.binary,
//             _id: req.user as string,
//         }
//     };


//     res.send(result);
// });


router.get("/dish/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, time: 1, image: { binary: 1 } } });

    res.send(result);
});






export {
    router as KitchenRouter,
}