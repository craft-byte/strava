import { Router } from "express";
import { ObjectId } from "mongodb";
import { Order } from "../../../models/general";
import { id } from "../../../utils/functions";
import { sendMessage } from "../../../utils/io";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";
import { getUser, updateUser } from "../../../utils/users";


const router = Router({ mergeParams: true });



router.get("/dish/:orderDishId/info", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const result: any = {
        ui: {
            showComponents: false,
            showRecipee: false,
            showUser: false,
            taken: false,
        },
        cooking: {},
        user: {},
        dish: {},
        order: {},
        taken: {}
    }


    const order = (await Orders(restaurantId).one(orderId).get({ projection: { customer: 1, id: 1, type: 1, ordered: 1, dishes: { _id: 1, dishId: 1 } } }));


    if (!order) {
        return res.sendStatus(404);
    }
    const { customer, dishes, id, type, ordered } = order;
    const user = await getUser(customer, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });

    result.order = {
        time: getDelay(ordered!),
        number: id,
        type,
        dishes: dishes.length,
        _id: orderId,
    }
    result.ui.showUser = true;
    if (user) {
        result.user = {
            name: user.name || user.username,
            avatar: user.avatar?.binary,
            _id: customer,
        }
    } else {
        // const result = await Orders(restaurantId).one(orderId).remove();
        // if (result.deletedCount == 0) {
        //     console.log("WATAFUUUUUUUUUUUUUUUUUUUUUUUCl");
        // }
        result.user = {
            name: "Removed",
        }
    }



    const getDishId = () => {
        for (let i of dishes!) {
            console.log(i._id, orderDishId);
            if (i._id.equals(orderDishId)) {
                return i.dishId;
            }
        }
        return null;
    }
    const dishId = getDishId();
    if (!dishId) {
        console.log("NOT DIHS ID????????????????????????????????????");
        return res.sendStatus(404);
    }

    const dish = await Restaurant(restaurantId).dishes.one(dishId!).get({ projection: { cooking: 1, name: 1, time: 1, image: { binary: 1, resolution: 1, } } });

    if (dish) {
        result.dish = {
            _id: dish._id,
            name: dish.name,
            image: { binary: dish.image?.binary, resolution: dish.image?.resolution == 1 ? "r1" : dish.image!.resolution == 1.33 ? "r2" : "r3" },
            time: dish.time,
        }
        if (dish.cooking) {
            if (dish.cooking.components) {
                result.ui.showComponents = true;

                const componentIds: ObjectId[] = [];

                for (let i of dish.cooking.components) {
                    componentIds.push(i._id);
                }

                const components = await Restaurant(restaurantId).components.getMany(componentIds, { amount: 1, name: 1, _id: 1, });

                if (components) {
                    const convertedComponents = [];

                    for (let i in components) {
                        if (!components[i]) {
                            console.log("NOT INPLEMETEDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
                            continue;
                        }
                        convertedComponents.push({
                            name: components[i].name,
                            amount: dish.cooking.components[i].amount,
                            of: components[i].amount,
                            _id: components[i]._id,
                        });
                    }

                    result.cooking.components = convertedComponents;
                }
            }


            if (dish.cooking.recipee) {
                result.ui.showRecipee = true;
                result.cooking.recipee = dish.cooking.recipee;
            }

        }
    } else {
        return res.sendStatus(404);
    }

    for (let i of dishes!) {
        if (i._id.equals(orderDishId)) {
            if (i.status == "cooking") {
                const user = await getUser(i.cook!, { projection: { name: 1, username: 1, avatar: 1, } });
                result.ui.taken = true;
                result.taken = {
                    time: getDelay(i.taken!),
                    user: {
                        name: user.name || user.username,
                        avatar: user.avatar?.binary,
                        _id: user._id,
                    }
                }
            }
            break;
        }
    }




    res.send(result);
});

router.post("/dish/:orderDishId/take", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const update = await Orders(restaurantId)
        .one(orderId)
        .update({
            $set: {
                "dishes.$[dish].taken": Date.now(),
                "dishes.$[dish].cook": id(req.user as string),
                "dishes.$[dish].status": "cooking"
                // "dishes.$[dish].taken": {
                //     time: Date.now(),
                //     userId: id(req.user as string)
                // },
                // "statistics.$[order].dishes.$[dish].status": 2
            },
        }, {
            arrayFilters: [{ "dish._id": id(orderDishId) }],
            projection: { socketId: 1 }
        });

    res.send({ success: update.ok > 0 });

    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/dish/take",
        data: {
            orderDishId,
            orderId
        },
    });

    if(update.order.socketId) {
        sendMessage([update.order.socketId], "client", {
            type: "customer/dish/status",
            data: {
                orderDishId,
                orderId,
                status: 2,
            },
        });
    }
});
router.delete("/dish/:orderDishId/done", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const update1 = await Orders(restaurantId).one({ status: "progress", _id: id(orderId) }).update({
        $set: {
            "dishes.$[dish].cooked": Date.now(),
            "dishes.$[dish].status": "cooked"
        },
    }, {
        arrayFilters: [ { "dish._id": id(orderDishId) } ],
        projection: { dishes: { status: 1, dishId: 1, _id: 1, } }
    });

    const order = update1.order;
    let dishId: ObjectId = null!;
    

    // if(order.dishes!.length == 0) {
    //     const update2 = await Orders(restaurantId).update(
    //         { $pull: { "orders": { _id: id(orderId) } } },
    //         {  }
    //     );
    //     const update3 = await updateUser(
    //         order.customer!,
    //         { $push: { orders: {
    //             $each: [{
    //                 ...update1.statistics,
    //                 restaurantId: id(restaurantId)
    //             }],
    //             $position: 0
    //         } } }
    //     );

    //     console.log("order removed: ", update2.modifiedCount > 0);
    //     console.log("user history added: ", update3.modifiedCount > 0);
    // }

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
            if(order.socketId) {
                sendMessage([order.socketId], "client", {
                    type: "customer/dish/status",
                    data: {
                        dishName: dish?.name,
                        orderId,
                        orderDishId,
                        status: 3,
                    }
                });
            }
        }
    } else {
        console.log("HOW NO DISH? staff/kitchen/order.ts    /dish/:orderDishId/done");
    }

    res.send({ success: update1.ok == 1 });


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


export {
    router as OrderRouter,
}