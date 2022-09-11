import { Router } from "express";
import { io } from "../../..";
import { Time } from "../../../models/components";
import { Order } from "../../../models/general";
import { id } from "../../../utils/functions";
import { sendMessage } from "../../../utils/io";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { getUser } from "../../../utils/users";
import { convertDishes } from "./functions";


const router = Router({ mergeParams: true });


router.post("/init", async (req ,res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;

    if(!socketId) {
        console.log("NO SOCKET ID WAITER: DANGER");
    } else {
        io.in(socketId).socketsJoin(`${restaurantId}/waiter`);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1  } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    res.send({
        restaurant,
        ...await convertDishes(restaurantId)
    });
});
router.get("/dish/:dishId", async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, image: 1 } });

    res.send(result);
});


interface Dish {
    _id: string;
    name: string;
    image: {
        binary: any;
        resolution: number;
    }
} interface OrderLocal {
    type: "order" | "table";
    number: string;
} interface User {
    name: string;
    username: string;
    avatar: { binary: any; };
} interface RequestResult {
    comment: string;
    cook: User;
    user: User;
    dish: Dish;
    time: Time;
    timeDone: Time;
    order: OrderLocal;
}; router.get("/:orderId/dish/:orderDishId", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const result: RequestResult = {
        dish: null!,
        user: null!,
        cook: null!,
        time: null!,
        timeDone: null!,
        comment: null!,
        order: {
            type: null!,
            number: null!,
        }
    }


    const order = await Orders(restaurantId).one({ _id: id(orderId) }).get({
        projection: {
            customer: 1,
            id: 1,
            type: 1,
            ordered: 1,
            dishes: {
                _id: 1,
                dishId: 1,
                ordered: 1,
                cooked: 1,
                comment: 1,
                cook: 1,
                status: 1,
            }
        }
    });

    if(!order) {
        return res.status(404).send({ reason: "order" });
    }

    for(let i of order.dishes) {
        if(i._id.equals(orderDishId)) {
            if(i.status != "cooked") {
                return res.status(403).send({ reason: "cooked" });
            }
            result.comment = i.comment;
            result.cook = (await getUser(i.cook!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } })) as any;
            result.user = (await getUser(order.customer!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } })) as any;
            result.dish = (await Restaurant(restaurantId).dishes.one(i.dishId).get({ projection: { name: 1, image: { binary: 1, resolution: 1, } } })) as any
            result.time = getDelay(order.ordered!);
            result.timeDone = getDelay(i.cooked!);
            result.order.number = order.id!;
            result.order.type = order.type == "in" ? "table" : "order";

            break;
        }
    }

    res.send(result);
});

router.delete("/:orderId/dish/:orderDishId/served", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;


    const result = await Orders(restaurantId).one({ _id: id(orderId) }).update(
        { $set: {
            "dishes.$[dish].status": "served",
            "dishes.$[dish].waiter": id(req.user as string),
            "dishes.$[dish].served": Date.now(),
        } },
        { arrayFilters: [{ "dish._id": id(orderDishId) }] }
    );

    console.log(result);





    let newStatus: Order["status"] = "done";

    for(let i in result.order.dishes) {
        if(result.order.dishes[i].status != "served" && result.order.dishes[i].status != "removed") {
            newStatus = "progress";
        }
    }

    if(result.order.status != newStatus) {
        const statusUpdate = await Orders(restaurantId).one({ _id: id(orderId)}).update({ $set: { status: newStatus } }, { projection: { _id: 1, } });

        if(statusUpdate.ok == 0) {
            console.log("ERROR order status is not updated --order done--");
        }
        if(newStatus == "done") {
            const remove = await Orders(restaurantId).one({_id: id(orderId)}).remove();
            const update = await Orders(restaurantId).history.insert(remove.value as Order);
            console.log("order moved to history:", update.acknowledged);
        }
    }


    res.send({ success: result.ok == 1 });

    sendMessage([`${restaurantId}/waiter`], "waiter", {
        type: "waiter/dish/served",
        data: {
            orderDishId,
            orderId,
        }
    });
    
    if(result.order.socketId) {
        sendMessage([result.order.socketId], "customer", {
            type: "customer/dish/status",
            data: {
                orderDishId,
                orderId,
                status: 4
            }
        });
    }
});


export {
    router as WaiterRouter
}