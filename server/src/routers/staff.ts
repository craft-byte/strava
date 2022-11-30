import { Router } from "express";
import { io } from "..";
import { Settings } from "../models/components";
import { Locals } from "../models/other";
import { logged } from "../utils/middleware/logged";
import { allowed } from "../utils/middleware/restaurantAllowed";
import { Orders, Restaurant } from "../utils/restaurant";
import { getUser } from "../utils/users";
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
router.get("/:restaurantId/dashboard", logged({ _id: 1 }), allowed({ info: { name: 1 }, staff: 1 }, "staff"), async (req, res) => {
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

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, price: 1, info: { time: 1 }, image: { binary: 1 } } });
    
    res.send(result);
});
router.get("/:restaurantId/dish/:dishId/image", logged({ _id: 1 }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { image: { binary: 1 } } });

    res.send({ ...result?.image });
});



interface Order {
    time: string;
    total: number;
    user: {
        name: string;
        _id: any;
    };
};
router.post("/:restaurantId/orders", logged({ _id: 1 }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { restaurantId } = req.params;
    const { socketId } = req.body;

    if(socketId) {
        io.in(socketId).socketsJoin(restaurantId);
    }

    const date = new Date()

    date.setHours(0,0,0,0);

    const orders = await (await Orders(restaurantId).history.many({ ordered: { $gte: date.getTime() }, mode: "disabled" }, { projection: { ordered: 1, onBehalf: 1, money: { total: 1, } } })).sort({ ordered: -1 }).toArray();


    const result: Order[] = [];

    const users: Order["user"][] = [];

    for(let i of orders) {
        const date = new Date(i.ordered!);

        let user: Order["user"];

        for(let u of users) {
            if(i.onBehalf?.equals(u._id)) {
                user = u;
                break;
            }
        }

        if(!user!) {
            const u = await getUser(i.onBehalf!, { projection: { name: { first: 1, } } });

            if(u) {
                user = {
                    name: u!.name?.first || "Deleted",
                    _id: u._id,
                };
                users.push(user);
            }
        }


        result.push({
            total: i.money?.total! | 0,
            time: `${date.getHours()}:${ date.getMinutes().toString().length == 1 ? "0" + date.getMinutes() : date.getMinutes() }`,
            user: user!,
        });
    }
    


    res.send(result);
});


export {
    router as StaffRouter
}