import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { Time } from "../../models/components";
import { User } from "../../models/general";
import { Order } from "../../models/Order";
import { DishHashTableUltra } from "../../utils/dish";
import { getDate, id } from "../../utils/functions";
import { logged } from "../../utils/middleware/logged";
import { getRelativeDelay } from "../../utils/other";
import { Orders } from "../../utils/orders";
import { getUser } from "../../utils/users";


const router = Router({ mergeParams: true });


interface ConvertedOrder {
    user: {
        _id: any;
        name: string;
    };
    dishes: number;
    _id: any;
    status: Order["status"];
    date: string;
    total: number;
    by: string;
    blacklisted: boolean;
    statusColor: "green" | "red" | "purple" | "orange";
};
/**
 * @returns { ConvertedOrder[] } - list of last 12 orders
 */
router.get("/orders", logged({ _id: 1 }), allowed({ blacklist: 1 }, { restaurant: { customers: true } }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { restaurant } = res.locals;
    const { p: skip } = req.query;

    const filter = parseQuery(req.query as any);

    const orders = await (await Orders(restaurantId).history.many(filter, { limit: 12, skip: (Number(skip || 0) || 0) * 12 })).sort({ ordered: -1, }).toArray();

    if(!orders || orders.length == 0) {
        return res.send([]);
    }

    const result = [];

    const isBlacklisted = (userId: string | ObjectId) => {
        if(!restaurant.blacklist) {
            return false;
        }
        for(let i of restaurant.blacklist!) {
            if(i.equals(userId)) {
                return true;
            }
        }
        return false;
    }

    for(let i of orders) {
        let user: ConvertedOrder["user"] = null!;
        if(i.customer) {
            const userdata = await getUser(i.customer, { projection: { name: 1, } });
            user = {
                name: userdata?.name?.first || "User deleted",
                _id: userdata?._id,
            }
        } else if(i.onBehalf) {
            const userdata = await getUser(i.onBehalf, { projection: { name: 1, } });
            user = {
                name: userdata?.name?.first || "User deleted",
                _id: userdata?._id,
            }
        } else {
            user = {
                name: "Anonymous",
                _id: null,
            }
        }
        const one: ConvertedOrder = {
            status: i.status,
            _id: i._id,
            date: getDate(i.ordered!),
            by: i.onBehalf ? "staff" : "customer",
            user: user as any,
            dishes: i.dishes.length,
            total: i.money?.total!,
            statusColor: i.status == "progress" ? "purple" : i.status == "done" ? "green" : i.status == "removed" ? "red" : "orange",
            blacklisted: isBlacklisted(i.customer || i.ip!)
        };
        result.push(one);
    }


    res.send({ orders: result, });
});

interface FullOrder {
    ordered: string;
    type: "dinein" | "takeout";
    id: string;
    status: string;
    mode: string;
    buyer: string;
    
    money: {
        total: number;
        subtotal: number;
        hst: number;
    };

    user: {
        _id: any;
        username: string;
        avatar: any;
    }


    dishes: {
        name: string;
        status: string;
        dishId: string;
        _id: string;

        taken?: Time;
        cooked?: Time;
        served?: Time;


        cook?: {
            username: string;
            avatar: any;
            userId: string;
        };
        waiter?: {
            username: string;
            avatar: any;
            userId: string;
        }
        takenBy?: {
            username: string;
            avatar: any;
            userId: string;
        }

        removed?: {
            username: string;
            avatar: any;
            time: Time;
        };
    }[];
};
/**
 * @returns { FullOrder } - info about whole order and all its dishes
 */
router.get("/order/:orderId", logged({ _id: 1 }), allowed({ _id: 1, }, { restaurant: { customers: true } }), async (req, res) => {
    const { restaurantId, orderId } = req.params;

    const order = await Orders(restaurantId).history.one({ _id: id(orderId) });
    
    if(!order) {
        return res.send(null);
    }
    
    let user: FullOrder["user"] = null!;

    if(order.customer) {
        const userdata = await getUser(order.customer, { projection: { username: 1, name: 1, avatar: { binary: 1, }}})
        user = {
            username: userdata?.name?.first || "User deleted",
            avatar: userdata?.avatar?.binary!,
            _id: userdata?._id!.toString()
        }
    } else if(order.onBehalf) {
        const userdata = await getUser(order.onBehalf!, { projection: { username: 1, name: 1, avatar: { binary: 1, }}})
        user = {
            username: userdata?.name?.first || "User deleted",
            avatar: userdata?.avatar?.binary!,
            _id: userdata?._id!.toString()
        }   
    } else {
        user = {
            username: "Anonymous",
            avatar: null!,
            _id: null!,
        }
    }

    const result: FullOrder = {
        ordered: getDate(order.ordered!),
        dishes: [],
        money: order.money!,
        type: order.type,
        id: order.id,
        status: order.status,
        user: user,
        mode: order.mode,
        buyer: order.onBehalf ? "staff" : "customer",
    };


    const dishes = new DishHashTableUltra(restaurantId, { name: 1, price: 1 });


    for(let dish of order.dishes) {
        const restaurantDish = await dishes.get(dish.dishId);
        // result.total += restaurantDish?.price || dish.price!;

        const one: FullOrder["dishes"][0] = {
            name: restaurantDish?.name || dish.name!,
            _id: dish._id.toString(),
            dishId: dish.dishId.toString(),
            status: dish.status,
        };

        if(dish.status == "removed") {
            const user = await getUser(dish.removed!.userId, { projection: { name: 1, username: 1, avatar: { binary: 1, } } });
            one.removed = {
                avatar: user?.avatar?.binary!,
                username: user?.name?.first || "User deleted",
                time: await getRelativeDelay(order.ordered!, dish.removed!.time!),
            }
        }
        if(dish.taken) {
            one.taken = await getRelativeDelay(order.ordered!, dish.taken!);
            const user = await getUser(dish.takenBy!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });
            one.takenBy = {
                username: user?.name?.first || "User deleted",
                avatar: user?.avatar?.binary!,
                userId: user?._id!.toString() || null!,
            }
        }
        if(dish.cooked) {
            one.cooked = await getRelativeDelay(dish.taken!, dish.cooked!, { dishId: dish.dishId, restaurantId });
            const user = await getUser(dish.cook!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });
            one.cook = {
                username: user?.name?.first || "User deleted",
                avatar: user?.avatar?.binary!,
                userId: user?._id!.toString() || null!,
            }
        }
        if(dish.served) {
            one.served = await getRelativeDelay(dish.cooked!, dish.served!);
            const user = await getUser(dish.waiter!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });
            one.waiter = {
                username: user?.name?.first || "User deleted",
                avatar: user?.avatar?.binary!,
                userId: user?._id!.toString() || null!,
            }
        }

        result.dishes.push(one);
    }



    res.send(result);
});


/**
 * @returns small info about a customer
 */
router.get("/user/:userId", logged({ _id: 1 }), allowed({ _id: 1 }, { restaurant: { customers: true } }), async (req, res) => {
    const { userId, restaurantId } = req.params as any;

    const user = await getUser(userId, { projection: { blacklisted: 1, name: 1, username: 1, avatar: 1 } });

    if(!user) {
        return res.status(404).send({ reason: "user" });
    }

    const orders: any = await Orders(restaurantId).history.many({ customer: id(userId) }, { projection: { dishes: { dishId: 1 } } });


    const dishes = new DishHashTableUltra(restaurantId, { price: 1, name: 1, });
    
    let total = 0;
    const fav: any = {};
    
    for(let i of orders) {
        for(let j of i.dishes) {
            const dish = await dishes.get(j.dishId);
            if(dish) {
                total += dish.price!;
                if(fav[j.dishId.toString()]) {
                    fav[j.dishId.toString()] += 1;
                } else {
                    fav[j.dishId.toString()] = 1;
                }
            }
        }
    }
    
    let favorite: string;
    let ind = 0;

    for(let i of Object.keys(fav)) {
        if(ind < fav[i]) {
            ind = fav[i];
            favorite = i;
        }
    }

    const isBlacklisted = (id: string | ObjectId) => {
        if(!user?.blacklisted) {
            return false;
        }
        for(let i of user?.blacklisted!) {
            if(i.equals(id)) {
                return true;
            }
        }
        return false;
    }

    res.send({
        user,
        total,
        favorite: await dishes.get(favorite!),
        blacklisted: isBlacklisted(restaurantId),
    });
});

export {
    router as PeopleRouter
}







function parseQuery(ps: { [key: string]: string }) {
    const result: any = {};

    for(let i of Object.keys(ps)) {
        const filterName = i.split("-")[0];
        if(filterName == "ordered") {
            const func = i.split("-")[1]

            if(func && func && ["lt", "gt", "gte", "lte"].includes(func)) {
                if(!result["ordered"]) {
                    result["ordered"] = {};
                }
                if(ps[i] && !isNaN(Number(ps[i]))) {
                    result["ordered"][`$${func}`] = Number(ps[i]);
                }
            }
        } else if(filterName == "amount") {
            const func = i.split("-")[1]

            if(func && func && ["lt", "gt", "gte", "lte", "eq"].includes(func)) {
                if(!result["money.total"]) {
                    result["money.total"] = {};
                }
                if(ps[i] && !isNaN(Number(ps[i]))) {
                    result["money.total"][`$${func}`] = Number(ps[i]);
                }
            }
        } else if(filterName == "dishes") {
            const func = i.split("-")[1]

            if(func && func && ["lt", "gt", "gte", "lte", "eq"].includes(func)) {
                if(!result["$expr"]) {
                    result["$expr"] = {};
                }
                if(ps[i] && !isNaN(Number(ps[i]))) {
                    result["$expr"][`$${func}`] = [
                        {
                            $size: "$dishes"
                        },
                        Number(ps[i])
                    ];
                }
            }
        } else if(filterName == "status") {
            const status = ps[i];
            if(["done"].includes(status)) {
                result["status"] = status;
            }
        }
    }

    console.log(result);

    return result;
}