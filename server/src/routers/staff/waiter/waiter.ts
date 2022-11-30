import { Router } from "express";
import { io } from "../../..";
import { Time } from "../../../models/components";
import { Order } from "../../../models/general";
import { Locals } from "../../../models/other";
import { id } from "../../../utils/functions";
import { sendMessage } from "../../../utils/io";
import { logged } from "../../../utils/middleware/logged";
import { allowed } from "../../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { getUser } from "../../../utils/users";
import { convertDishes } from "./functions";
import { ManualRouter } from "./manual";


const router = Router({ mergeParams: true });

router.use("/manual", ManualRouter);


router.post("/init", logged({ _id: 1 }), allowed({ _id: 1, info: { name: 1 } }, "waiter"), async (req ,res) => {
    const { restaurantId } = req.params as any;
    const { socketId } = req.body;
    const { restaurant } = res.locals as Locals;

    if(!socketId) {
        console.log("NO SOCKET ID WAITER: DANGER");
    } else {
        io.in(socketId).socketsJoin(`${restaurantId}/waiter`);
    }


    res.send({
        restaurant,
        ...await convertDishes(restaurantId)
    });
});


router.get("/dishes", logged({ _id: 1 }), allowed({ _id: 1, }, "waiter"), async (req, res) => {
    const { restaurantId } = req.params;

    
    const result = await convertDishes(restaurantId);


    res.send(result);
});


interface OrderInfo {
    type: "dinein" | "takeout";
    number: string;
    comment: string;
    customer: User;
}; interface User {
    name: string;
    avatar: any;
    _id: string;
}; interface Response {
    dish: {
        comment: string;
        cook: User;
        ordered: Time;
        timeDone: Time;
        id: string;
    }
    order: OrderInfo;
}; router.get("/order/:orderId/dish/:orderDishId", logged({ _id: 1 }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const result: Response = {
        dish: {
            cook: null!,
            ordered: null!,
            timeDone: null!,
            comment: null!,
            id: null!,
        },
        order: {
            customer: null!,
            type: null!,
            number: null!,
            comment: null!,
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
                id: 1,
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
            const cook = (await getUser(i.cook!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } }));
            const user = (await getUser(order.customer!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } }));
            result.order.comment = order.comment!;
            result.dish.comment = i.comment;
            result.dish.cook = {
                name: cook?.name ? cook.name.first : "User deleted",
                avatar: cook?.avatar?.binary || null,
                _id: i.cook!.toString(),
            };
            result.order.customer = {
                name: user?.name ? user.name?.first : "User deleted",
                avatar: cook?.avatar?.binary || null,
                _id: order.customer?.toString() || null!,
            };
            result.dish.ordered = getDelay(order.ordered!);
            result.dish.timeDone = getDelay(i.cooked!);
            result.order.number = order.id!;
            result.order.type = order.type;
            result.dish.id = i.id!;

            break;
        }
    }

    res.send(result);
});

router.delete("/order/:orderId/dish/:orderDishId/served", logged({ _id: 1 }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;
    const { user } = res.locals as Locals;

    const result = await Orders(restaurantId).one({ _id: id(orderId) }).update(
        { $set: {
            "dishes.$[dish].status": "served",
            "dishes.$[dish].waiter": id(user._id),
            "dishes.$[dish].served": Date.now(),
        } },
        { arrayFilters: [{ "dish._id": id(orderDishId) }] }
    );



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