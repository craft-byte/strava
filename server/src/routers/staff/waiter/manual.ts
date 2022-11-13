import { Router } from "express";
import { stripe } from "../../..";
import { Order } from "../../../models/general";
import { Locals } from "../../../models/other";
import { id } from "../../../utils/functions";
import { logged } from "../../../utils/middleware/logged";
import { allowed } from "../../../utils/middleware/restaurantAllowed";
import { Orders, Restaurant } from "../../../utils/restaurant";

const router = Router({ mergeParams: true });



/**
 * @param { string } text - searched text
 * 
 * @throws { status: 422; reason: "InvalidText"; } - searched text is invalid
 * @throws { status: 404; reason: "DishesNotFound" } - restaurant doesn't have any dishes
 * 
 * @returns array of dishes
 */
router.post("/find", logged({ _id: 1 }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { text } = req.body;
    const { restaurantId } = req.params;

    if(!text || typeof text != "string") {
        return res.status(422).send({ reason: "InvalidText" });
    }

    const t = text.toLowerCase();

    const names = await Restaurant(restaurantId).dishes.many({}).get({ projection: { name: 1 } });


    if(!names || names.length == 0) {
        return res.status(404).send({ reason: "DishesNotFound" });
    }

    const ids = [];

    for(let { name, _id } of names) {
        if(!name) {
            continue;
        }
        const n = name!.toLowerCase();
        let index = 0;
        while(n.length > index) {
            if(n.substring(index, t.length + index).toLowerCase() == t.toLowerCase()) {
                ids.push(_id);
                break;
            }
            index++;
        }
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { name: 1, price: 1, } });

    res.send(dishes);
});



interface ReturnedDish {
    name: string;
    price: number;
    time: number;
    category: string;
    description: string;
    image: { binary: any; resolution: number; };
}
/**
 * @param { string } dishId - id of the dish
 * 
 * @returns { }
 */
router.get("/dish/:dishId", logged({ _id: 1, }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { dishId, restaurantId } = req.params;

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, description: 1, info: { time: 1 }, price: 1, general: 1, image: { binary: 1, resolution: 1, } } });


    if(!dish) {
        return res.send(null);
    }

    const result: ReturnedDish = {
        name: dish.name!,
        price: dish.price!,
        description: dish.description!,
        time: dish.info?.time!,
        category: dish.general!,
        image: {
            binary: dish.image?.binary,
            resolution: dish.image?.resolution!,
        }
    }

    res.send(result);
});


router.get("/info", logged({ _id: 1, }), allowed({ tables: 1, settings: { customers: { allowTakeAway: 1 } } }, "waiter"), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    
    if(!restaurant.tables || restaurant.tables == 0) {
        return res.send({ out: true, in: false });
    }
    
    const tables = [];
    for(let i = 0; i < restaurant.tables!; i++) {
        tables.push({ id: i + 1 });
    }


    res.send({ out: restaurant.settings?.customers.allowTakeAway, in: true, tables });
});


router.post("/cash", logged({ _id: 1 }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { dishes, comment, table } = req.body;
    const { restaurantId } = req.params;
    const { user } = res.locals;

    const newDishes: Order["dishes"] = [];
    const ids = [];

    for(let dish of dishes) {
        ids.push(id(dish._id));
    }

    const dshs = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { price: 1, name: 1, } });
    
    let subtotal: number = 0;

    for(let dish of dishes) {
        let price: number;
        let name: string;
        for(let j of dshs) {
            if(j._id.equals(dish._id)) {
                price = j.price!;
                name = j.name!;
                break;
            }
        }
        subtotal += price! * dish.amount;
        for(let i = 0; i < dish.amount; i++) {

            newDishes.push({
                _id: id()!,
                price: price!,
                name: name!,
                dishId: id(dish._id)!,
                comment: null!,
                status: "ordered",
            });
        }
    }

    const result = await Orders(restaurantId).createSession({
        status: "progress",
        dishes: newDishes,
        customer: null,
        type: table ? "dinein" : "takeaway",
        onBefalf: id(user._id),
        by: "staff",
        id: table,
        comment,
        ordered: Date.now(),
        money: {
            subtotal,
            hst: subtotal * Number(subtotal * 0.13),
            total: subtotal * Number(subtotal * 0.13) + subtotal,
        },
        socketId: null!,
        _id: id()!,
    });

    res.send({ success: result });
});



router.post("/card", logged({ _id: 1 }), allowed({ _id: 1, stripeAccountId: 1, }, "waiter"), async (req, res) => {
    const { dishes, comment, table } = req.body;
    const { restaurantId } = req.params;
    const { restaurant } = res.locals as Locals;


    const ids = [];
    for(let i of dishes) {
        ids.push(id(i._id));
    }

    
    const dshs = await Restaurant(restaurantId).dishes.many({ _id: { $in: ids } }).get({ projection: { price: 1 } });

    if(dshs.length != dishes.length) {
        return res.status(404).send({ reason: "InvalidDishes" });
    }
    
    let subtotal = 0;

    for(let i of dishes) {
        for(let j of dshs) {
            if(j._id.equals(i._id)) {
                subtotal += j.price! * i.amount;
                break;
            }
        }
    }

    let hst = subtotal * 0.13;
    let total = hst + subtotal;


    try {
        const p = await stripe.paymentIntents.create({
            amount: Math.floor(total),
            currency: "cad",
            metadata: {
                restaurantId: restaurantId,
                customerIp: req.ip,
                type: "manual",
                order: JSON.stringify({ dishes, comment, table, money: { hst, total, subtotal, } }),
            },
            transfer_data: {
                destination: restaurant.stripeAccountId!,
            },
        });

        res.send({ clientSecret: p.client_secret });
    } catch (e) {
        throw e;
    }


});

export {
    router as ManualRouter
}