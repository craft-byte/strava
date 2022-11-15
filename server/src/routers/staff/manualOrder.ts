import { Router } from "express";
import { ObjectId } from "mongodb";
import { ordersDBName } from "../../environments/server";
import { Locals } from "../../models/other";
import { DishHashTableUltra } from "../../utils/dish";
import { id } from "../../utils/functions";
import { sendMessage } from "../../utils/io";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { user } from "../../utils/users";



const router = Router({ mergeParams: true });


router.get("/init", logged({ _id: 1 }), allowed({ _id: 1, settings: { customers: 1, } }, "staff"), async (req, res) => {
    const { restaurantId } = req.params;
    const { restaurant, user } = res.locals as Locals;

    
    const dishes = await Restaurant(restaurantId).dishes.many({ }).get({ projection: { image: { binary: 1, }, name: 1, price: 1, general: 1, info: { time: 1 }, } });

    let order = await Orders(restaurantId).one({ onBefalf: id(user._id), status: "ordering" }).get({ projection: { dishes: { _id: 1, dishId: 1, comment: 1, }, comment: 1, type: 1, } });

    if(!order) {
        await Orders(restaurantId).createSession({
            _id: id()!,
            status: "ordering",
            onBefalf: user._id,
            type: "dinein",
            id: null!,
            socketId: null!,
            by: "staff",
            customer: null!,
            dishes: [],
        });

        order = { dishes: [], type: "dinein", comment: null! } as any;
    }

    const d = new DishHashTableUltra(restaurantId, { name: 1, price: 1 });

    const ds: { orderDishes: { _id: any; comment: string; }[]; name: string; price: number; _id: any; }[] = [];

    for(let i of order.dishes) {
        if(d.table[i.dishId.toString()]) {
            continue;
        }
        const dish = await d.get(i.dishId);

        if(dish) {
            ds.push({
                name: dish.name!,
                price: dish.price!,
                _id: dish._id,
                orderDishes: order.dishes,
            });
        }
    }

    res.send({
        order,
        selected: ds,
        dishes,
        settings: restaurant.settings?.customers,
    });
});


router.post("/order/type", logged({ _id: 1, }), allowed({ _id: 1, settings: { customers: 1, } }, "staff"), async (req, res) => {
    const { restaurant, user, } = res.locals as Locals;
    const { type } = req.body;

    if(!type || !["takeaway", "dinein"].includes(type)) {
        return res.status(422).send({ reason: "InvalidType" });
    }

    if((type == "takeaway" && !restaurant.settings?.customers.allowTakeAway) || (type == "dinein" && !restaurant.settings?.customers.allowDineIn)) {
        return res.status(403).send({ reason: "TypeNotAllowed"});
    }

    const update = await Orders(restaurant._id).one({ onBefalf: user._id, status: "ordering" }).update({ $set: { type } });
    
    res.send({ updated: update.ok == 1 });
});
router.post("/order/comment", logged({ _id: 1, }), allowed({ _id: 1, }, "staff"), async (req, res) => {
    const { restaurantId } = req.params;
    const { comment } = req.body;
    const { user } = res.locals as Locals;

    if(!comment || typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidComment" });
    }


    const result = await Orders(restaurantId).one({ onBefalf: user._id, status: "ordering" }).update({ $set: { comment } });


    res.send({ updated: result.ok == 1 });
});
router.post("/order/dish", logged({ _id: 1, }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { dishId } = req.body;
    const { restaurant, user } = res.locals as Locals;


    if(!dishId || typeof dishId != "string" || dishId.length != 24) {
        return res.status(422).send({ reason: "InvalidDishId" });
    }
    
    const newId = id()!;

    const update = await Orders(restaurant._id).one({ onBefalf: user._id, status: "ordering" }).update({ $push: { dishes: { dishId: id(dishId), _id: newId, status: "ordered", comment: null!, } } });


    if(update.ok == 1) {
        return res.send({ _id: newId });
    }

    res.send(null);
});
router.post("/order/dish/:orderDishId/comment", logged({ _id: 1, }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { orderDishId, restaurantId } = req.params;
    const { user } = res.locals as Locals;
    const { comment } = req.body;

    if(!comment || typeof comment != "string") {
        return res.status(422).send({ reason: "InvalidComment" });
    }

    const result = await Orders(restaurantId).one({ onBefalf: user._id, status: "ordering" }).update({ $set: { "dishes.$[dish].comment": comment == "./;" ? null! : comment } }, { arrayFilters: [ { "dish._id": id(orderDishId) } ] })

    res.send({ updated: result.ok == 1 });
});
router.delete("/order/dish/:orderDishId", logged({ _id: 1 }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { orderDishId, restaurantId } = req.params;
    const { user } = res.locals as Locals;


    const update = await Orders(restaurantId).one({ onBefalf: user._id, status: "ordering" }).update({ $pull: { dishes: { _id: id(orderDishId) } } });

    res.send({ updated: update.ok == 1 });
});



router.get("/checkout", logged({ _id: 1, }), allowed({ settings: { money: 1 } }, "staff"), async (req, res) => {
    const { restaurant, user, } = res.locals as Locals;

    if(restaurant.settings?.money?.card != "enabled" && restaurant.settings?.money?.cash != "enabled") {
        return res.status(403).send({ reason: "NoPaymentMethodEnabled" });
    }

    
    const order = await Orders(restaurant._id).one({ onBefalf: user._id, status: "ordering" }).get({ projection: { dishes: { dishId: 1, } } });

    let subtotal = await calculateSubtotal(restaurant._id, order.dishes);

    if(!subtotal) {
        return res.status(500).send({ reason: "DishesAreInvalidNotImplemented" });
    }

    let hst = Math.floor(subtotal * 0.13);
    let total = Math.floor(hst + subtotal);


    res.send({
        money: {
            total,
            subtotal,
            hst,
        },
        methods: {
            card: restaurant.settings.money.card == "enabled",
            cash: restaurant.settings.money.cash == "enabled",
        }
    });
});


router.post("/order/confirm/cash", logged({ _id: 1, }), allowed({ _id: 1 }, "staff"), async (req, res) => {
    const { user, restaurant } = res.locals as Locals;

    const update = await Orders(restaurant._id)
        .one({ onBefalf: user._id, status: "ordering" })
        .update(
            { $set: { status: "progress", method: "cash", ordered: Date.now() } },
            { projection: { _id: 1, ordered: 1, dishes: { _id: 1, dishId: 1, } } }
        );


        
    res.send({ updated: update.ok == 1 });
        
    const forKitchen = [];

    const time = getDelay(update.order.ordered!);
    for (let i in update.order.dishes!) {
        forKitchen.push({
            orderId: update.order._id,
            ...update.order.dishes![i],
            time,
        });
    }

    sendMessage([`${restaurant._id.toString()}/kitchen`], "kitchen", {
        type: "kitchen/order/new",
        event: "kitchen",
        data: forKitchen,
    });
});


async function calculateSubtotal(rid: any, arr: { dishId: any }[]) {
    const idsstr = new Set<string>();
    for(let i of arr) {
        idsstr.add(i.dishId.toString());
    }

    const ids: ObjectId[] = [];

    for(let i of Array.from(idsstr)) {
        ids.push(id(i)!);
    }

    const dishes = await Restaurant(rid).dishes.many({ _id: { $in: ids } }).get({ projection: { price: 1 } });

    if(dishes.length != ids.length) {
        return null;
    }

    let subtotal = 0;
    for(let i of dishes) {
        subtotal += i.price!;
    }

    return subtotal;
}

// router.post("/confirm-order", logged({ _id: 1, }), allowed({ _id: 1, }, "staff"), async (req, res) => {
//     const { dishes, comment, type } = req.body;
//     const { restaurantId } = req.params;


//     const orderDishes: Order["dishes"] = [];

//     for(let i of dishes) {
//         for(let c = 0; c < i.amount; c++) {
//             orderDishes.push({
//                 _id: id()!,
//                 dishId: i._id,
//                 status: "ordered",
//                 comment: null!,
//             });
//         }
//     }

//     const orderId = id()!;

//     const result = await Orders(restaurantId).createSession({
//         _id: orderId,
//         status: "progress",
//         comment,
//         dishes: orderDishes,
//         socketId: null!,
//         customer: null!,
//         id: null!,
//         type: null!,
//         ordered: Date.now(),
//     });


//     res.send({ success: result });

//     const forKitchen = [];
//     const time = getDelay(Date.now());
//     for (let i in orderDishes!) {
//         forKitchen.push({
//             orderId: orderId,
//             ...orderDishes![i],
//             time,
//         });
//     }


//     sendMessage([`${restaurantId}/kitchen`], "kitchen", {
//         type: "kitchen/order/new",
//         event: "kitchen",
//         data: forKitchen,
//     });
// });



export {
    router as ManualOrderRouter
} 