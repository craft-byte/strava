import { Router } from "express";
import { io } from "..";
import { allowed } from "../middleware/restaurant";
import { logged } from "../middleware/user";
import { Settings } from "../models/components";
import { Restaurant } from "../utils/restaurant";
import { KitchenRouter } from "./staff/kitchen/kitchen";
import { WaiterRouter } from "./staff/waiter/waiter";

const router = Router();


router.use("/:restaurantId/kitchen", logged, allowed("cook"), KitchenRouter);
router.use("/:restaurantId/waiter", logged, allowed("waiter"), WaiterRouter);

router.get("/:restaurantId/dashboard", logged, allowed("staff"), async (req, res) => {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, staff: 1 } });

    const user: any = {
        showWaiter: false,
        showKitchen: false,
        role: null
    };

    for(let i of restaurant?.staff!) {
        if(i.userId.toString() == req.user) {
            user.showKitchen = i.role == "cook" || i.role == "owner" || (i.role == "manager" ? (i.settings as Settings.ManagerSettings).work.cook : false);
            user.showWaiter = i.role == "waiter" || i.role == "owner" || (i.role == "manager" ? (i.settings as Settings.ManagerSettings).work.waiter : false);
            user.role = i.role;
        }
    }

    res.send({ restaurant, user });
});

router.post("/:restaurantId/socketReconnect", logged, allowed("staff"), async (req, res) => {
    const { id, joinTo } = req.body;
    const { restaurantId } = req.params;

    if(joinTo == "kitchen" || joinTo == "waiter") {
        io.in(id).socketsJoin(`${restaurantId}/${joinTo}`);
    }

    res.send(null);
});


export {
    router as StaffRouter
}