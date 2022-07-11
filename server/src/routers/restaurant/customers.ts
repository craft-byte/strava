import { Router } from "express";
import { allowed } from "../../middleware/restaurant";
import { StatisticsOrder } from "../../models/components";
import { DishHashTableUltra } from "../../utils/dish";
import { getDate, id } from "../../utils/functions";
import { Restaurant, Stats } from "../../utils/restaurant";
import { getUser, updateUser } from "../../utils/users";


const router = Router({ mergeParams: true });

interface Customer {
    name: string;
    avatar: any;
    visit: any;
    total: string;
    _id: string;
    blacklisted: boolean;
}
router.get("/", allowed("manager", "customers"), async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { blacklist: 1 } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    const orders = await Stats(restaurantId).getMany(99);

    if(!orders || orders.length == 0) {
        return res.send(null);
    }

    const userIds: { [key: string]: { total: number; last: number; } } = {};
    const dishes = new DishHashTableUltra(restaurantId, { price: 1 });

    for(let i of orders) {
        let e = userIds[i.userId.toString()];
        if(!e) {
            userIds[i.userId.toString()] = {
                total: 0,
                last: i.time,
            };
            e = userIds[i.userId.toString()];
        }
        if(e.last < i.time) {
            e.last = i.time;
        }
        for(let j of i.dishes) {
            const dish = await dishes.get(j.dishId);
            if(dish) {
                e.total += dish.price!;
            }
        }
    }

    const result: Customer[] = [];

    const isBlacklisted = (id: string) => {
        if(!restaurant.blacklist) {
            return false;
        }
        for(let i of restaurant.blacklist!) {
            if(i.equals(id)) {
                return true;
            }
        }
        return false;
    }

    for(let i of Object.keys(userIds)) {
        const user = await getUser(i, { projection: { name: 1, avatar: 1, username: 1, } });

        result.push({
            name: user.name! || user.username!,
            _id: i,
            avatar: user.avatar!,
            total: (userIds[i].total / 100).toFixed(2),
            visit: getDate(userIds[i].last),
            blacklisted: isBlacklisted(i),
        });
    }

    res.send(result);
});
router.delete("/blacklist/:userId", allowed("manager", "staff", "blacklisting"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $addToSet: { blacklist: id(userId)! } });

    const user = await updateUser(userId, { $addToSet: { blacklisted: id(restaurantId) } });

    console.log("user added to blacklist: ", restaurant!.modifiedCount > 0);
    console.log("restaurant added to banned: ", user!.modifiedCount > 0);

    res.send({ done: restaurant!.modifiedCount > 0 && user.modifiedCount > 0 });
});
router.delete("/unblacklist/:userId", allowed("manager", "staff", "blacklisting"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).update({ $pull: { blacklist: id(userId)! } });
    const user = await updateUser(userId, { $pull: { blacklisted: id(restaurantId) } });


    console.log("removed from blacklist: ", restaurant!.modifiedCount > 0 && user!.modifiedCount > 0);

    res.send({ done: restaurant!.modifiedCount > 0 && user!.modifiedCount > 0 });
});
router.get("/:userId", allowed("manager", "customers"), async (req, res) => {
    const { restaurantId, userId } = req.params as any;

    const user = await getUser(userId, { projection: { name: 1, username: 1, avatar: 1, blacklisted: 1 } });


    const ordersArr: any[] = await Stats(restaurantId).aggregate([
        { $unwind: "$statistics" },
        { $match: { "statistics.userId": id(userId) } },
        { $group: { _id: null, orders: { $push: "$statistics" } } }
    ]) as any;

    if(!ordersArr || !ordersArr[0]) {
        return res.send({ user });
    }

    const orders = ordersArr[0].orders as StatisticsOrder[];

    const convertedOrders = [];
    const userDetails: { total: number; last: number; } = {
        total: 0, last: null!,
    };
    const dishes = new DishHashTableUltra(restaurantId, { price: 1, name: 1});

    
    for(let i of orders) {
        if(!userDetails.last) {
            userDetails.last = i.time;
        }
        if(userDetails.last < i.time) {
            userDetails.last = i.time;
        }
        const index = convertedOrders.push({
            date: getDate(i.time),
            _id: i._id,
            dishes: [] as any,
            status: i.status == 1 ? "PROGRESS" : i.status == 2 ? "DONE" : "REMOVED",
            color: i.status == 1 ? "purple" : i.status == 2 ? "green" : "red",
        }) - 1;
        for(let j of i.dishes) {
            const dish = await dishes.get(j.dishId);
            if(dish) {
                convertedOrders[index].dishes.push(dish);
                userDetails.total += dish.price!;
            }
        }
    }

    const isBlacklisted = () => {
        for(let i of user.blacklisted!) {
            if(i.equals(restaurantId)) {
                return true;
            }
        }
        return false;
    }

    res.send({
        user,
        details: {
            total: userDetails.total / 100,
            visited: getDate(userDetails.last),
        },
        blacklisted: isBlacklisted(),
        orders: convertedOrders,
    });
});



export {
    router as CustomersRouter
}