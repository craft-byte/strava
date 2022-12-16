import { Router } from "express";
import { Time } from "../../../models/components";
import { Order } from "../../../models/Order";
import { Locals } from "../../../models/other";
import { id } from "../../../utils/functions";
import { logged } from "../../../utils/middleware/logged";
import { allowed } from "../../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../../utils/other";
import { Orders } from "../../../utils/orders";
import { getUser } from "../../../utils/users";
import { sendMessageToCustomer, sendMessageToWaiter } from "../../../utils/io";
import { Restaurant } from "../../../utils/restaurant";
import { ObjectId } from "mongodb";
import { confirmOrder } from "../../../utils/confirmOrder";


const router = Router({ mergeParams: true });



router.get("/init", logged({ _id: 1 }), allowed({ _id: 1, }, { work: { waiter: true } }), async (req, res) => {
    const { restaurantId } = req.params;
    const { user } = res.locals as Locals;


    
    const [progress, ordering] = await Promise.all([
        Orders(restaurantId).many({ status: "progress" }, { projection: { _id: 1, ordered: 1, dishes: { status: 1, dishId: 1, _id: 1, id: 1, } } }),
        Orders(restaurantId).many({ status: "ordering" }, { projection: { _id: 1, customer: 1, waiterRequests: 1, } }),
    ]);

    // Use a Map to store the unique dish IDs
    const dishIds = new Map<string, boolean>();
    for (const order of progress) {
        for (const dish of order.dishes) {
            dishIds.set(dish.dishId.toString(), true);
        }
    }

    // Array to store the unique dish IDs
    const dishIdArray: ObjectId[] = [];
    for (let i of Array.from(dishIds.keys())) {
        dishIdArray.push(id(i));
    }

    // Find the dishes to assign name and time of the dish to orderDish to show it faster
    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: dishIdArray } }).get({ projection: { name: 1, image: 1 } });

    // Use a for loop to create an array of results

    const orderDishes = [];
    for (const order of progress) {
        // go through dishes filter dishes that have to be served and assign name and time to them
        for (const dish of order.dishes) {

            if (dish.status === "cooked") {
                orderDishes.push({
                    _id: dish._id,
                    dishId: dish.dishId,
                    time: getDelay(order.ordered!),
                    orderId: order._id,
                    id: dish.id,
                });
            }

        }
    }


    let acceptedWaiterRequest;
    const waiterRequests = [];
    for(let order of ordering) {
        // customer not initialized until one active request found
        let customer: any;

        // filter for active waiter requests
        for(let request of order.waiterRequests) {
            if(!request.active) {
                continue;
            }

            if(!customer && order.customer) {
                const user = await getUser(order.customer, { projection: { name: 1, avatar: { binary: 1 } } });

                customer = {
                    name: `${user?.name?.first} ${user?.name?.last}`,
                    _id: user?._id,
                    avatar: user?.avatar?.binary,
                };
            }

            waiterRequests.push({
                requested: getDelay(request.requestedTime),
                _id: request._id,
                reason: request.reason,
                sessionId: order._id,
                customer: customer || {
                    name: "A customer",
                }
            });

            if(request.waiter && request.waiter.equals(user._id)) {
                acceptedWaiterRequest = {
                    requested: getDelay(request.requestedTime),
                    _id: request._id,
                    reason: request.reason,
                    sessionId: order._id,
                    customer: customer || {
                        name: "A customer",
                    }
                }
            }
        }
    }


    res.send({ acceptedWaiterRequest, orderDishes: orderDishes, waiterRequests: waiterRequests, dishes: dishes, });
});


router.delete("/waiterRequest/:requestId", logged({ }), allowed({}, { work: { waiter: true } }), async (req, res) => {
    const { restaurantId, requestId } = req.params;
    const { user } = res.locals as Locals;
    
    if(!restaurantId || !requestId) {
        return res.sendStatus(400);
    }


    const update = await Orders(restaurantId)
        .one({ waiterRequests: { $elemMatch: { _id: id(requestId) } } })
        .update(
            { $set: {
                "waiterRequests.$[waiterRequestId].active": false,
                "waiterRequests.$[waiterRequestId].requestCanceledTime": Date.now(),
                "waiterRequests.$[waiterRequestId].waiter": user._id,
            } },
            {
                arrayFilters: [ { "waiterRequestId._id": id(requestId) } ],
                projection: {
                    socketId: 1,
                }
            }
        );

    if(update.ok == 1) {
        sendMessageToCustomer(update.order.socketId!, "waiterRequest/canceled", {
            requestId: id(requestId)
        });
        sendMessageToWaiter(restaurantId, "request/removed", {
            requestId: requestId,
        });
    }

    res.send({ updated: update.ok == 1 });

});
router.get("/waiterRequest/:requestId", logged({ }), allowed({}, { work: { waiter: true } }), async (req, res) => {
    const { restaurantId, requestId } = req.params;
    const { user } = res.locals as Locals;
    
    if(!restaurantId || !requestId) {
        return res.sendStatus(400);
    }


    const session = await Orders(restaurantId)
        .one({ waiterRequests: { $elemMatch: { _id: id(requestId) } } })
        .get({
            projection: {
                waiterRequests: 1,
                customer: 1
            }
        });

    let newRequest: any;

    for(let request of session.waiterRequests) {
        if(request._id.equals(requestId)) {

            let customer;
            if(session.customer) {
                const user = await getUser(session.customer, {
                    projection: { name: 1, avatar: { binary: 1, } }
                });

                customer = {
                    name: `${user?.name?.first} ${user?.name?.last}`,
                    avatar: user?.avatar?.binary,
                    _id: user?._id,
                }
            }

            newRequest = {
                _id: requestId,
                time: getDelay(request.requestedTime),
                reason: request.reason,
                sessionId: session._id,
                customer: customer || {
                    name: "A customer"
                }
            };
        }
    }


    res.send(newRequest);

});
router.post("/waiterRequest/:requestId", logged({ avatar: 1, name: 1, }), allowed({ }, { work: { waiter: true }}), async (req, res) => {
    const { restaurantId, requestId } = req.params;
    const { user } = res.locals as Locals;

    if(!restaurantId || !requestId) {
        return res.sendStatus(400);
    }

    const update = await Orders(restaurantId)
        .one({ waiterRequests: { $elemMatch: { _id: id(requestId) } } })
        .update(
            { $set: {
                "waiterRequests.$[request].waiter": user._id,
                "waiterRequests.$[request].requestAcceptedTime": Date.now(),
            } },
            { arrayFilters: [ { "request._id": id(requestId) } ], projection: { socketId: 1 } }
        );

    if(update.ok == 1 && update.order) {
        sendMessageToCustomer(update.order.socketId, "waiterRequest/accepted", {
            waiter: { name: `${user.name?.first || "A"} ${user.name?.last || "customer"}`, avatar: user.avatar?.binary, _id: user._id },
            requestId: requestId
        });
    }

    res.send({
        updated: update.ok == 1,
    });
});
router.delete("/waiterRequest/:requestId/quit", logged({ }), allowed({ }, { work: { waiter: true } }), async (req, res) => {
    const { restaurantId, requestId } = req.params;

    const update = await Orders(restaurantId)
        .one({ waiterRequests: { $elemMatch: { _id: id(requestId) } } })
        .update(
            { $set: {
                "waiterRequests.$[waiterRequestId].requestAcceptedTime": null,
                "waiterRequests.$[waiterRequestId].waiter": null,
            } },
            {
                arrayFilters: [ { "waiterRequestId._id": id(requestId) } ],
                projection: {
                    socketId: 1,
                }
            }
        );

    if(update.ok == 1) {
        sendMessageToCustomer(update.order.socketId, "waiterRequest/quitted", {
            requestId: requestId,
        });
    }

    res.send({ updated: update.ok == 1 });
});

router.post("/session/payed", logged({ }), allowed({ settings: { money: 1, } }, { work: { waiter: true } }), async (req, res) => {
    const { sessionId, requestId } = req.body;
    const { restaurant } = res.locals as Locals;

    if(!sessionId || !requestId) {
        return res.sendStatus(422);
    }

    if(!restaurant || !restaurant.settings || !restaurant.settings.money) {
        return res.sendStatus(500);
    }


    if(restaurant.settings.money.cash != "enabled") {
        return res.status(403).send({ reason: "CashPaymentsDisabled" });
    }


    await confirmOrder(restaurant._id, sessionId, "cash");

    const update = await Orders(restaurant._id).one({ _id: id(sessionId) })
        .update(
            { $set: {
                "waiterRequests.$[request].active": false,
                "waiterRequests.$[request].requestResolvedTime": Date.now(),
            } },
            { arrayFilters: [ { "request._id": id(requestId) } ], projection: { progress: 1, socketId: 1, } },
        );


    res.send({ updated: update.ok == 1 });
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
}; router.get("/order/:orderId/dish/:orderDishId", logged({ _id: 1 }), allowed({ _id: 1 }, { work: { waiter: true, } }), async (req, res) => {
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

    if (!order) {
        return res.status(404).send({ reason: "order" });
    }

    for (let i of order.dishes) {
        if (i._id.equals(orderDishId)) {
            if (i.status != "cooked") {
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

router.delete("/order/:orderId/dish/:orderDishId/served", logged({ _id: 1 }), allowed({ _id: 1 }, { work: { waiter: true } }), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;
    const { user } = res.locals as Locals;

    const result = await Orders(restaurantId).one({ _id: id(orderId) }).update(
        {
            $set: {
                "dishes.$[dish].status": "served",
                "dishes.$[dish].waiter": id(user._id),
                "dishes.$[dish].served": Date.now(),
            }
        },
        { arrayFilters: [{ "dish._id": id(orderDishId) }] }
    );



    let newStatus: Order["status"] = "done";

    for (let i in result.order.dishes) {
        if (result.order.dishes[i].status != "served" && result.order.dishes[i].status != "removed") {
            newStatus = "progress";
        }
    }

    if (result.order.status != newStatus) {
        const statusUpdate = await Orders(restaurantId).one({ _id: id(orderId) }).update({ $set: { status: newStatus } }, { projection: { _id: 1, } });

        if (statusUpdate.ok == 0) {
            console.log("ERROR order status is not updated --order done--");
        }
        if (newStatus == "done") {
            const remove = await Orders(restaurantId).one({ _id: id(orderId) }).remove();
            const update = await Orders(restaurantId).history.insert(remove.value as Order);
            console.log("order moved to history:", update.acknowledged);
        }
    }


    res.send({ success: result.ok == 1 });

    sendMessageToWaiter(restaurantId, "dish/served", {
        _id: orderDishId,
        orderId: orderId,
        dishId: null!,
    });

    if (result.order.socketId) {
        sendMessageToCustomer(result.order.socketId, "dish/status", {
            _id: orderDishId,
            orderId: orderId,
            status: "served"
        });
    }
});


export {
    router as WaiterRouter
}