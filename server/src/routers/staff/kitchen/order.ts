import { Router } from "express";
import { ObjectId } from "mongodb";
import { Order, User } from "../../../models/general";
import { Locals } from "../../../models/other";
import { id } from "../../../utils/functions";
import { sendMessage } from "../../../utils/io";
import { logged } from "../../../utils/middleware/logged";
import { allowed } from "../../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { getUser } from "../../../utils/users";


const router = Router({ mergeParams: true });



router.get("/dish/:orderDishId/info", logged({ _id: 1, }), allowed({ _id: 1 }, "cook"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const result: any = {
        ui: {
            showUser: false,
            taken: false,
        },
        customer: {},
        dish: {},
        order: {},
        taken: {}
    }


    const order = (await Orders(restaurantId).one({ _id: id(orderId) }).get({ projection: {
        customer: 1,
        id: 1,
        type: 1,
        ordered: 1,
        comment: 1,
        dishes: {
            _id: 1,
            dishId: 1,
            status: 1,
            cook: 1,
            taken: 1,
            takenBy: 1,
            comment: 1,
        } 
    } }));


    if (!order) {
        return res.sendStatus(404);
    }
    const { ip, customer, dishes, id: Id, type, ordered, comment } = order;

    let user: User | any;
    if(ip && !customer) {
        result.customer = {
            name: "Anonymous",
            avatar: null,
            _id: null,
            user: false,
        }
    } else {
        user = await getUser(customer!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });

        result.ui.showCustomer = true;
        if (user) {
            result.customer = {
                name: user?.name?.first,
                avatar: user?.avatar?.binary,
                _id: customer,
                user: true,
            }
        } else {
            result.customer = {
                name: "User deleted",
                avatar: null,
                _id: null,
                user: false,
            };
        }
    }



    
    result.order = {
        time: getDelay(ordered!),
        number: Id,
        type,
        dishes: dishes.length,
        _id: orderId,
        comment,
    }



    const getDishId = () => {
        for (let i of dishes!) {
            if (i._id.equals(orderDishId)) {
                return i.dishId;
            }
        }
        return null;
    }
    const dishId = getDishId();
    if (!dishId) {
        return res.sendStatus(404);
    }

    // const dish = await Restaurant(restaurantId).dishes.one(dishId!).get({ projection: { cooking: 1, name: 1, info: { time: 1, }, image: { binary: 1, resolution: 1, } } });

    // if (dish) {
    //     result.dish = {
    //         _id: dish._id,
    //         name: dish.name,
    //         image: { binary: dish.image?.binary, resolution: dish.image?.resolution == 1 ? "r1" : dish.image!.resolution == 1.33 ? "r2" : "r3" },
    //         time: dish.info?.time,
    //     }
    //     if (dish.cooking) {
    //         if (dish.cooking.components) {
    //             result.ui.showComponents = true;

    //             const componentIds: ObjectId[] = [];

    //             for (let i of dish.cooking.components) {
    //                 componentIds.push(i._id);
    //             }

    //             const components = await Restaurant(restaurantId).components.getMany(componentIds, { amount: 1, name: 1, _id: 1, });

    //             if (components) {
    //                 const convertedComponents = [];

    //                 for (let i in components) {
    //                     if (!components[i]) {
    //                         console.log("NOT INPLEMETEDDDD");
    //                         continue;
    //                     }
    //                     convertedComponents.push({
    //                         name: components[i].name,
    //                         amount: dish.cooking.components[i].amount,
    //                         of: components[i].amount,
    //                         _id: components[i]._id,
    //                     });
    //                 }

    //                 result.cooking.components = convertedComponents;
    //             }
    //         }


    //         if (dish.cooking.recipee) {
    //             result.ui.showRecipee = true;
    //             result.cooking.recipee = dish.cooking.recipee;
    //         }

    //     }
    // } else {
    //     return res.sendStatus(404);
    // }

    for (let i of dishes!) {
        if (i._id.equals(orderDishId)) {
            if (i.status == "cooking") {
                const user = await getUser(i.takenBy!, { projection: { name: 1, username: 1, avatar: 1, } });
                result.ui.taken = true;
                result.taken = {
                    time: getDelay(i.taken!),
                    user: {
                        name: user?.name?.first || "User deleted",
                        avatar: user?.avatar?.binary,
                        _id: user?._id,
                    }
                }
            }
            result.order.dishComment = i.comment;
            break;
        }
    }


    res.send(result);
});


/**
 * 
 * changes dish status to 'cooking'
 * customers can't remove this dish from their order anymore
 * 
 */
router.post("/dish/:orderDishId/take", logged({ _id: 1, name: 1, avatar: 1, }), allowed({ _id: 1, }, "cook"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;
    const { user } = res.locals as Locals;

    const order = await Orders(restaurantId).one({ _id: id(orderId), dishes: { $elemMatch: { _id: id(orderDishId) } }})
        .get({ projection: { dishes: { _id: 1, status: 1, } } });

    for(let i of order.dishes) {
        if(i._id.equals(orderDishId) && i.status == "cooking" && !i.takenBy!.equals(user._id)) {
            return res.status(403).send({ reason: "taken" });
        }
    }

    const update = await Orders(restaurantId)
        .one({_id: id(orderId) })
        .update({
            $set: {
                "dishes.$[dish].taken": Date.now(),
                "dishes.$[dish].takenBy": user._id,
                "dishes.$[dish].status": "cooking"
            },
        }, {
            arrayFilters: [{ "dish._id": id(orderDishId) }],
            projection: { socketId: 1 }
        });
    
        
    res.send({
        success: update.ok == 1,
        taken: {
            time: { hours: 0, minutes: 0, nextMinute: 59500, color: "green" },
            user: {
                name: user?.name?.first || "User deleted",
                avatar: user?.avatar?.binary,
                _id: user._id,
            }
        },
    });


    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/dish/take",
        data: {
            orderDishId,
            orderId,
            taken: {
                time: { hours: 0, minutes: 0, nextMinute: 59500, color: "green" },
                user: {
                    name: user?.name?.first! || "User deleted",
                    avatar: user?.avatar?.binary,
                    _id: user._id,
                }
            }
        },
    });

    if(update.order.socketId) {
        sendMessage([update.order.socketId], "customer", {
            type: "customer/dish/status",
            data: {
                orderDishId,
                orderId,
                status: 2,
            },
        });
    }
});
router.delete("/dish/:orderDishId/done", logged({ _id: 1, }), allowed({ _id: 1 }, "cook"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;
    const { user } = res.locals as Locals;

    const update1 = await Orders(restaurantId).one({ status: "progress", _id: id(orderId) }).update({
        $set: {
            "dishes.$[dish].cooked": Date.now(),
            "dishes.$[dish].cook": user._id,
            "dishes.$[dish].status": "cooked",
        },
    }, {
        arrayFilters: [ { "dish._id": id(orderDishId) } ],
        projection: { socketId: 1, dishes: { status: 1, dishId: 1, _id: 1, } },
        returnDocument: "before",
    });

    const order = update1.order;
    let dishId: ObjectId = null!;

    for(let i of order.dishes) {
        if(i._id.equals(orderDishId)) {
            dishId = i.dishId;
            break;
        }
    }

    if(dishId) {
        const dish = await Restaurant(restaurantId).dishes.one(dishId).get({
            projection: {
                name: 1,
                cooking: { components: 1 }
            }
        });
    
        if(dish) {
            if(dish?.cooking) {
                for(let i of dish?.cooking?.components!) {
                    Restaurant(restaurantId).components.substract(i._id, i.amount);
                }
            }
        }
    } else {
        console.log("HOW NO DISH? staff/kitchen/order.ts    /dish/:orderDishId/done");
    }

    res.send({ success: update1.ok == 1 });


    sendMessage([order.socketId], "customer", {
        type: "customer/dish/status",
        data: {
            orderId,
            orderDishId,
            status: 3,
        }
    });
    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/dish/done",
        data: {
            orderId,
            orderDishId
        },
    });
    sendMessage([`${restaurantId}/waiter`], "waiter", {
        type: "waiter/dish/new",
        data: {
            orderId,
            _id: orderDishId,
            time: { hours: 0, minutes: 0, nextMinute: 59900, color: 'green' },
            dishId,
        }
    });
});
router.delete("/dish/:orderDishId/quit", logged({ _id: 1 }), allowed({ _id: 1 }, "cook"), async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const update1 = await Orders(restaurantId).one({ status: "progress", _id: id(orderId) }).update({
        $set: {
            "dishes.$[dish].taken": null,
            "dishes.$[dish].takenBy": null,
            "dishes.$[dish].status": "ordered",
        },
    }, {
        arrayFilters: [ { "dish._id": id(orderDishId) } ],
        projection: { _id: 1, socketId: 1 },
    });


    res.send({ success: update1.ok == 1 });


    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/dish/quitted",
        data: {
            orderId,
            orderDishId
        },
    });

    sendMessage([update1.order.socketId], "customer", {
        type: "customer/dish/status",
        data: {
            orderId,
            orderDishId,
            status: 1,
        },
    });
});


export {
    router as OrderRouter,
}