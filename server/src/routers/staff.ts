import { Router } from "express";
import { io } from "..";
import { Settings } from "../models/components";
import { logged } from "../utils/middleware/logged";
import { allowed } from "../utils/middleware/restaurantAllowed";
import { Restaurant } from "../utils/restaurant";
import { KitchenRouter } from "./staff/kitchen/kitchen";
import { WaiterRouter } from "./staff/waiter/waiter";

const router = Router();


router.use("/:restaurantId/kitchen", KitchenRouter);
router.use("/:restaurantId/waiter", WaiterRouter);

router.get("/:restaurantId/dashboard", logged({ _id: 1 }), allowed({ name: 1, staff: 1 }, "staff"), async (req, res) => {
    const { restaurant, user } = res.locals;


    const ui: any = {
        showWaiter: false,
        showKitchen: false,
        role: null
    };

    console.log(restaurant.staff);

    for(let i of restaurant?.staff!) {
        if(user._id.equals(i.userId)) {
            ui.showKitchen = i.role == "cook" || i.role == "owner" || (i.role == "manager" ? (i.settings as Settings.ManagerSettings).work.cook : false);
            ui.showWaiter = i.role == "waiter" || i.role == "owner" || (i.role == "manager" ? (i.settings as Settings.ManagerSettings).work.waiter : false);
            ui.role = i.role;
        }
    }

    res.send({ restaurant, user: ui });
});

router.post("/:restaurantId/socketReconnect", logged({ _id: 1 }), allowed({ _id: 1 }, "staff"), async (req, res) => {
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