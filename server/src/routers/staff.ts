import { Router } from "express";
import { allowed } from "../middleware/restaurant";
import { logged } from "../middleware/user";
import { ManagerSettings } from "../models/components";
import { Restaurant } from "../utils/restaurant";
import { KitchenRouter } from "./staff/kitchen/kitchen";
import { WaiterRouter } from "./staff/waiter/waiter";

const router = Router();


router.use("/:restaurantId/kitchen", logged, allowed("cook"), KitchenRouter);
router.use("/:restaurantId/waiter", logged, allowed("waiter"), WaiterRouter);

router.get("/:restaurantId/dashboard", logged, allowed("staff"), async (req, res) => {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, staff: 1 } });

    const user = {
        showWaiter: false,
        showKitchen: false
    };

    for(let i of restaurant?.staff!) {
        if(i._id.toString() == req.user) {
            user.showKitchen = i.role == "cook" || i.role == "admin" || (i.role == "manager" ? (i.settings as ManagerSettings).work.cook : false);
            user.showWaiter = i.role == "waiter" || i.role == "admin" || (i.role == "manager" ? (i.settings as ManagerSettings).work.waiter : false);
        }
    }

    res.send({ restaurant, user });
});


export {
    router as StaffRouter
}