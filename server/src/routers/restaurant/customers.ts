import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../middleware/restaurant";
import { order } from "../../middleware/user";
import { DishHashTableUltra } from "../../utils/dish";
import { getDate, id } from "../../utils/functions";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser, updateUser } from "../../utils/users";


const router = Router({ mergeParams: true });

interface Customer {
    name?: string;
    avatar?: any;
    orders: number;
    lastOrdered: any;
    total: number;
    _id: string;
    blacklisted?: boolean;
} router.get("/", allowed("manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { calculate } = req.query;

    const restaurant = await Restaurant(restaurantId).get({ projection: { customersCache: 1, blacklist: 1, tables: 1 } });

    
    const qrCodes = [];
    for(let i = 0; i < restaurant!.tables!; i++) {
        qrCodes.push({
            table: i + 1,
            downloadUrl: `https://localhost:8101/order/${restaurant!._id.toString()}?table=${i + 1}`
        });
    }

    const isBlacklisted = (id: string | ObjectId) => {
        for(let i of restaurant!.blacklist!) {
            if(i.equals(id)) {
                return true;
            }
        }
        return false;
    }

    if(restaurant!.customersCache && calculate == "false") {
        if(Date.now() - restaurant!.customersCache.lastUpdate < 86400000) {
            const result = [];
            for(let i of restaurant!.customersCache.data) {
                const user = await getUser(i._id, { projection: { username: 1, name: 1, avatar: { binary: 1 } } });
                result.push({
                    ...i,
                    name: user?.name || user?.username || "User deleted",
                    avatar: user?.avatar?.binary,
                    blacklisted: isBlacklisted(i._id),
                });
            }
            return res.send({
                qrCodes,
                customers: result,
                lastUpdate: getDate(restaurant!.customersCache.lastUpdate)
            });
        }
    }

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
                    name: user?.name || user?.username || "User deleted",
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

    console.log("cache updated: ", update.modifiedCount > 0);
});

router.delete("/blacklist/:userId", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $addToSet: { blacklist: id(userId)! } });

    const user = await updateUser(userId, { $addToSet: { blacklisted: id(restaurantId)! } });

    console.log("user added to blacklist: ", restaurant!.modifiedCount > 0);
    console.log("restaurant added to banned: ", user!.modifiedCount > 0);

    res.send({ done: restaurant!.modifiedCount > 0 && user.modifiedCount > 0 });
});
router.delete("/unblacklist/:userId", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $pull: { blacklist: id(userId)! } });
    const user = await updateUser(userId, { $pull: { blacklisted: id(restaurantId)! } });


    console.log("removed from blacklist: ", restaurant!.modifiedCount > 0 && user!.modifiedCount > 0);

    res.send({ done: restaurant!.modifiedCount > 0 && user!.modifiedCount > 0 });
});
// router.get("/:userId", allowed("manager", "customers"), async (req, res) => {
//     const { restaurantId, userId } = req.params as any;

//     const user = await getUser(userId, { projection: { name: 1, username: 1, avatar: 1, blacklisted: 1 } });


//     const ordersArr: any[] = await Stats(restaurantId).aggregate([
//         { $unwind: "$statistics" },
//         { $match: { "statistics.userId": id(userId) } },
//         { $group: { _id: null, orders: { $push: "$statistics" } } }
//     ]) as any;

//     if(!ordersArr || !ordersArr[0]) {
//         return res.send({ user });
//     }

//     const orders = ordersArr[0].orders as [];

//     const convertedOrders = [];
//     const userDetails: { total: number; last: number; } = {
//         total: 0, last: null!,
//     };
//     const dishes = new DishHashTableUltra(restaurantId, { price: 1, name: 1});

    
//     for(let i of orders) {
//         if(!userDetails.last) {
//             userDetails.last = i.time;
//         }
//         if(userDetails.last < i.time) {
//             userDetails.last = i.time;
//         }
//         const index = convertedOrders.push({
//             date: getDate(i.time),
//             _id: i._id,
//             dishes: [] as any,
//             status: i.status == 1 ? "PROGRESS" : i.status == 2 ? "DONE" : "REMOVED",
//             color: i.status == 1 ? "purple" : i.status == 2 ? "green" : "red",
//         }) - 1;
//         for(let j of i.dishes) {
//             const dish = await dishes.get(j.dishId);
//             if(dish) {
//                 convertedOrders[index].dishes.push(dish);
//                 userDetails.total += dish.price!;
//             }
//         }
//     }

//     const isBlacklisted = () => {
//         for(let i of user.blacklisted!) {
//             if(i.equals(restaurantId)) {
//                 return true;
//             }
//         }
//         return false;
//     }

//     res.send({
//         user,
//         details: {
//             total: userDetails.total / 100,
//             visited: getDate(userDetails.last),
//         },
//         blacklisted: isBlacklisted(),
//         orders: convertedOrders,
//     });
// });


router.delete("/table", allowed("manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).update({ $inc: { tables: -1 } });

    res.send({ updated: result!.modifiedCount > 0 });
});
router.post("/table", allowed("manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).update({ $inc: { tables: 1 } });

    res.send({ updated: result!.modifiedCount > 0 });
});

export {
    router as CustomersRouter
}