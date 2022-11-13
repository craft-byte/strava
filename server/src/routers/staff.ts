import { Router } from "express";
import { io } from "..";
import { Settings } from "../models/components";
import { Locals } from "../models/other";
import { logged } from "../utils/middleware/logged";
import { allowed } from "../utils/middleware/restaurantAllowed";
import { Restaurant } from "../utils/restaurant";
import { KitchenRouter } from "./staff/kitchen/kitchen";
import { ManualOrderRouter } from "./staff/manualOrder";
import { OrderRouter } from "./staff/order";
import { WaiterRouter } from "./staff/waiter/waiter";

const router = Router();


router.use("/:restaurantId/cook", KitchenRouter);
router.use("/:restaurantId/waiter", WaiterRouter);
router.use("/:restaurantId/manual", ManualOrderRouter);
router.use("/:restaurantId/order", OrderRouter);


router.post("/:restaurantId/solo", logged({ _id: 1, }), async (req, res, next) => {
    const { user } = res.locals as Locals;
    const { restaurantId } = req.params;
    
    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { userId: 1, role: 1, settings: 1, }, } });

    if(!restaurant) {
        return res.status(404).send({ reason: "NoRestaurant" });
    }

    for(let i of restaurant.staff!) {
        if(i.userId.equals(user._id)) {
            if((i.role == "manager" && (i.settings as Settings.ManagerSettings).work.cook && (i.settings as Settings.ManagerSettings).work.waiter) || i.role == "owner") {
                return next();
            }
            return res.status(403).send({ reason: "NotAllowed" });
        }
    }
    return res.status(403).send({ reason: "NotMember" });
}, async (req, res) => {
    const { socketId } = req.body;
    const { restaurantId } = req.params as any;

    if(!socketId) {
        return res.status(403).send({ reason: "SocketIdNotProvided" });
    }

    io.in(socketId).socketsJoin([`${restaurantId}/waiter`, `${restaurantId}/kitchen`]);

    res.send(true);
});
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

router.get("/:restaurantId/dish/:dishId", logged({ _id: 1 }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, info: { time: 1 }, image: { binary: 1 } } });

    res.send(result);
});


export {
    router as StaffRouter
}