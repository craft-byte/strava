import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { DishHashTableUltra } from "../../utils/dish";
import { getDate, id } from "../../utils/functions";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser, updateUser } from "../../utils/users";
import { logged } from "../../utils/middleware/logged";
import { Locals } from "../../models/other";


const router = Router({ mergeParams: true });

interface Customer {
    name?: string;
    avatar?: any;
    orders: number;
    lastOrdered: any;
    total: number;
    _id: string;
    blacklisted?: boolean;
};
/**
 * @returns { Customer[] } - list of customers
 */
router.get("/", logged({ _id: 1 }), allowed({ customersCache: 1, blacklist: 1, tables: 1 }, "manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { calculate } = req.query;
    const { restaurant } = res.locals as Locals;

    const qrCodes = [];
    for(let i = 0; i < restaurant!.tables!; i++) {
        qrCodes.push({
            table: i + 1,
            link: `${req.protocol}://${req.get("host")}/customer/order/${restaurant!._id.toString()}?table=${i + 1}`,
            downloadUrl: null,
        });
    }

    const isBlacklisted = (id: string | ObjectId) => {
        for(let i of restaurant!.blacklist!) {
            if(typeof i != "string") {
                if(i.equals(id)) {
                    return true;
                }
            }
        }
        return false;
    }

    // if(restaurant!.customersCache && calculate == "false") {
    //     if(Date.now() - restaurant!.customersCache.lastUpdate < 86400000) {
    //         const result = [];
    //         for(let i of restaurant!.customersCache.data) {
    //             const user = await getUser(i._id, { projection: { username: 1, name: 1, avatar: { binary: 1 } } });
    //             result.push({
    //                 ...i,
    //                 name: user?.name?.first || "User deleted",
    //                 avatar: user?.avatar?.binary,
    //                 blacklisted: isBlacklisted(i._id),
    //             });
    //         }
    //         return res.send({
    //             qrCodes,
    //             customers: result,
    //             lastUpdate: getDate(restaurant!.customersCache.lastUpdate)
    //         });
    //     }
    // }

    const customers: { [key: string]: Customer } = {};
    const dishes = new DishHashTableUltra(restaurantId, { price: 1, });


    let stop = false;
    let limit = 1;

    const customerIds: ObjectId[] = [];

    while(!stop) {
        const search = { customer: { $in: customerIds } };
        const orders = await (await Orders(restaurantId).history
            .many(customerIds.length == 10 ? search : {}, { projection: { customer: 1, ordered: 1, dishes: { price: 1, dishId: 1, } } })).skip((limit - 1) * 10).limit(limit * 10).toArray();

        limit++;
        if(orders.length < 6) {
            stop = true;
        }

        for(let i of orders) {
            if(i.customer) {
                customerIds.push(i.customer);
                if(!customers[i.customer.toString()]) {
                    const user = await getUser(i.customer, { projection: { avatar: { binary: 1, }, username: 1, name: 1, } })
                    customers[i.customer.toString()] = {
                        total: 0,
                        orders: 0,
                        lastOrdered: getDate(i.ordered!),
                        _id: i.customer.toString(),
                        blacklisted: isBlacklisted(i.customer),
                        avatar: user?.avatar?.binary!,
                        name: user?.name?.first || "User deleted",
                    }
                }
                customers[i.customer.toString()].orders++;
                for(let { dishId, price } of i.dishes) {
                    if(price) {
                        customers[i.customer.toString()].total += price!;
                    } else {
                        const dish = await dishes.get(dishId);
                        if(dish) {
                            customers[i.customer.toString()].total += dish!.price!;
                        }
                    }
                }
            } else {
                /////// add anonymous people
            }
        }
    }

    const customersResult: Customer[] = [];

    for(let i of Object.keys(customers)) {
        customersResult.push(customers[i]);
    }

    res.send({ customers: customersResult, qrCodes, lastUpdate: getDate(Date.now()) });

    const cache = [];
    for(let i of customersResult) {
        delete i.avatar;
        delete i.blacklisted;
        delete i.name;
        cache.push(i);
    }

    const update = await Restaurant(restaurantId).update({ $set: { customersCache: { lastUpdate: Date.now(), data: cache } } })

    console.log("cache updated: ", update.ok == 0);
});

/**
 * add to blacklist
 * @returns { updated: boolean; }
 */
router.delete("/blacklist/:userId", logged({ _id: 1 }), allowed({ _id: 1, }, "manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $addToSet: { blacklist: id(userId)! } });

    const user = await updateUser(userId, { $addToSet: { blacklisted: id(restaurantId)! } });

    console.log("user added to blacklist: ", restaurant!.ok == 0);
    console.log("restaurant added to banned: ", user!.ok == 1);

    res.send({ updated: restaurant!.ok == 0 && user.ok == 1 });
});

/**
 * remove from blacklist
 * @returns { updated: boolean; }
 */
router.delete("/unblacklist/:userId", logged({ _id: 1, }), allowed({ _id: 1 }, "manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $pull: { blacklist: id(userId)! } });
    const user = await updateUser(userId, { $pull: { blacklisted: id(restaurantId)! } });


    console.log("removed from blacklist: ", restaurant!.ok == 0 && user!.ok == 1);

    res.send({ updated: restaurant!.ok == 0 && user!.ok == 1 });
});


interface Result {
    user: {
        name: string;
        email: string;
        avatar: any;
        _id: ObjectId;
    };
    orders?: {
        dishes: number;
        total: number;
        date: string;
        status: string;
        _id: ObjectId;
    }[];
    info?: {
        total: number;
        orders: number;
        lastVisit: string;
        blacklisted: boolean;
    }
};
/**
 * @returns { Result } a customer and a customer's all orders
 */
router.get("/:userId", logged({ _id: 1 }), allowed({ _id: 1 }, "manager", "customers"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const user = await getUser(userId, { projection: { name: 1, username: 1, avatar: 1, email: 1, blacklisted: 1 } });

    const orders = await (await Orders(restaurantId).history.many({ customer: id(userId) }, { projection: { ordered: 1, status: 1, _id: 1, dishes: { dishId: 1, price: 1 } }})).limit(7).toArray();
    const allOrders = await (await Orders(restaurantId).history.many({ customer: id(userId) }, { projection: { _id: 1 } })).toArray();

    const blacklisted = () => {
        if(!user) {
            return false;
        }
        if(!user.blacklisted) {
            return false;
        }
        for(let i of user?.blacklisted!) {
            if(i.equals(restaurantId)) {
                return true;
            }
        }
        return false;
    }

    const result: Result = {
        user: {
            name: user?.name?.first || "User deletd",
            avatar: user?.avatar?.binary,
            email: user?.email!,
            _id: user?._id!
        },
        orders: [],
        info: {
            total: 0,
            lastVisit: null!,
            orders: allOrders.length,
            blacklisted: blacklisted(),
        }
    }

    
    
    const dishes = new DishHashTableUltra(restaurantId, { price: 1 });
    let lastVisit = 0;
    
    for(let i of orders) {
        if(lastVisit < i.ordered!) {
            lastVisit = i.ordered!;
        }
        const index = result.orders!.push({
            date: getDate(i.ordered!)!,
            _id: i._id,
            dishes: i.dishes.length,
            status: i.status,
            total: 0,
        }) - 1;
        for(let { dishId, price } of i.dishes) {
            const dish = await dishes.get(dishId);
            if(dish) {
                result.orders![index].total += dish.price!;
                result.info!.total += dish.price!;
            } else {
                result.orders![index].total += price!;
                result.info!.total += price!;
            }
        }
    }

    result.info!.lastVisit = getDate(lastVisit);



    res.send(result);
});


/**
 * remove table
 */
router.delete("/table", logged({ _id: 1 }), allowed({ _id: 1 }, "manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).update({ $inc: { tables: -1 } });

    res.send({ updated: result!.ok == 1 });
});

/**
 * add table
 */
router.post("/table", logged({ _id: 1 }), allowed({ _id: 1 }, "manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).update({ $inc: { tables: 1 } }, { projection: { tables: 1 } });

    console.log(result.restaurant);


    res.send({ updated: result!.ok == 1, link: `${req.headers.origin}/customer/order/${restaurantId}?table=${result.restaurant?.tables}` });
});

export {
    router as CustomersRouter
}