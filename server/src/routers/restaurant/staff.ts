import { Router } from "express";
import { ObjectId } from "mongodb";
import { inflateRaw } from "zlib";
import { allowed } from "../../middleware/restaurant";
import { Settings } from "../../models/components";
import { Worker } from "../../models/worker";
import { getDate, id } from "../../utils/functions";
import { checkManagerSettings } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser, getUsers, updateUser } from "../../utils/users";


const router = Router({ mergeParams: true });


router.post("/", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId } = req.params;
    const { role, userId, settings } = req.body;

    const isWorks = await Restaurant(restaurantId).aggregate([
        // { $match: { _id: id(restaurantId) } },
        { $unwind: "$staff" },
        { $match: { "staff._id": id(userId) } },
        { $project: { found: "hello" } }
    ]);

    if (isWorks.length > 0) {
        return res.status(403).send({ reason: "works" });
    }

    if(role == "manager" && !checkManagerSettings(settings)) {
        return res.status(422).send({ reason: "settings" });
    }

    


    const userUpdate = await updateUser(userId, { $push: { restaurants: { restaurantId: id(restaurantId), role: role == "cook" || role == "waiter" ? "staff" : role == "manager" ? ((settings as Settings.ManagerSettings).work.cook || (settings as Settings.ManagerSettings).work.waiter) ? "waiter:working" : "waiter" : role } } });
    const restaurantUpdate = await Restaurant(restaurantId)
        .update({ $push: {
            staff: {
                userId: id(userId),
                joined: Date.now(),
                role,
                settings
            }
        }
    });

    console.log("user updated: ", userUpdate!.modifiedCount > 0);
    console.log("restaurant updated: ", restaurantUpdate!.modifiedCount > 0);

    res.send({ done: restaurantUpdate!.modifiedCount > 0 && userUpdate!.modifiedCount > 0 });
});
router.get("/", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId } = req.params as any;


    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { joined: 1, userId: 1, role: 1 } } })

    const ids: ObjectId[] = [];

    for (let i of restaurant?.staff!) {
        ids.push(i.userId);
    }

    const users = await getUsers({ _id: { $in: ids } }, { projection: { name: 1, avatar: 1, username: 1 } });



    const result = [];

    for (let i in restaurant!.staff!) {
        if(users[i]) {
            result.push({
                name: users[i].name || users[i].username,
                _id: users[i]._id,
                date: getDate(restaurant?.staff![i].joined!),
                role: restaurant?.staff![i].role,
                avatar: users[i].avatar?.binary,
            });    
        } else {
            result.push({
                name: "User deleted",
                avatar: null,
                _id: restaurant?.staff![i].userId,
                date: getDate(restaurant?.staff![i].joined!),
                role: restaurant?.staff![i].role,
            });
        }
    }



    res.send(result);
});

interface WorkerResult {
    restaurantName?: string;
    user?: {
        avatar: any;
        name: string;
        email?: string;
        _id: ObjectId;
    };
    worker?: {
        role: string;
        cooked?: number;
        joined: string;
        served?: number;
        lastUpdate?: string;
        favoriteDish?: {
            name: string;
            _id: string | ObjectId;
        }
    }
}; router.get("/:userId", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;
    const { calculate } = req.query;
    
    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, staff: 1 } });

    
    let worker: Worker | undefined;

    for(let i of restaurant!.staff!) {
        if(i.userId.equals(userId)) {
            worker = i;
            break;
        }
    }

    if(!worker) {
        return res.status(404).send({ reason: "worker" });
    }

    const user = await getUser(userId, { projection: { avatar: 1, username: 1, name: 1, email: 1 } });

    const result: WorkerResult = {
        restaurantName: restaurant!.name,
        user: {
            avatar: user?.avatar?.binary,
            name: user?.name || user?.username || "User deleted",
            _id: user?._id || worker.userId,
            email: user?.email || undefined,
        },
        worker: {
            role: worker.role,
            joined: getDate(worker.joined),
        }
    };


    if(
        !(
            worker.role == "manager" &&
            (
                !(worker.settings as Settings.ManagerSettings).work.cook ||
                !(worker.settings as Settings.ManagerSettings).work.waiter
            )
        )
    ) {
        if(
            worker.workerCache &&
            (calculate == "false" ) &&
            Date.now() - (worker.workerCache.lastUpdate) < 86400000)
        {
            const { lastUpdate, data } = worker.workerCache;
    
            result.worker = {
                lastUpdate: getDate(lastUpdate),
                cooked: data.cooked,
                served: data.served,
                role: worker.role,
                joined: getDate(worker.joined),
            };
        } else {
            const or: any = [];
            if(worker.role == "admin" || worker.role == "cook" || (worker.role == "manager" && (worker.settings as Settings.ManagerSettings).work.cook)) {
                or.push({ cook: id(userId) });
            }
            if(worker.role == "admin" || worker.role == "waiter" || (worker.role == "manager" && (worker.settings as Settings.ManagerSettings).work.waiter)) {
                or.push({ waiter: id(userId) });
            }
            
            let cooked = 0;
            let served = 0;
    
            let fav: { [dishId: string]: number } = {};
    
            let stop = false;
            let index = 1;
            while(!stop) {
                const orders = await (await Orders(restaurantId).history
                    .many(
                        { dishes: { $elemMatch: { $or: or } } },
                        { projection: { dishes: { cook: 1, waiter: 1, dishId: 1, } } }
                    )).skip((index - 1) * 10).limit(10 * index).toArray();
                index++;
    
                for(let order of orders) {
                    for(let dish of order.dishes) {
                        if((worker.role == "cook" || worker.role == "admin" || (worker.role == "manager" && (worker.settings as Settings.ManagerSettings).work.cook)) && dish.cook!.equals(userId)) {
                            cooked++;
                            if(fav[dish.dishId.toString()]) {
                                fav[dish.dishId.toString()]++;
                            } else {
                                fav[dish.dishId.toString()] = 1;
                            }
                        }
                        if((worker.role == "waiter" || worker.role == "admin" || (worker.role == "manager" && (worker.settings as Settings.ManagerSettings).work.waiter)) && dish.waiter!.equals(userId)) {
                            served++;
                        }
                    }
                }
    
                if(orders.length < 10) {
                    stop = true;
                }
            }
    
    
            result.worker!.cooked = cooked;
            result.worker!.served = served;
            result.worker!.lastUpdate = getDate(Date.now());
    
            let dishId: string | undefined;
            let most = 1;
    
            for(let i of Object.keys(fav)) {
                if(most < fav[i]) {
                    dishId = i;
                    most = fav[i];
                }
            }
    
            if(dishId) {
                const dish = await Restaurant(restaurantId).dishes.one(dishId!).get({ projection: { name: 1 } });
                if(dish) {
                    result.worker!.favoriteDish = {
                        _id: dishId || null!,
                        name: dish.name!
                    }
                }
            }
        }
    }

    

    res.send(result);
});

router.get("/:userId/settings", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { role: 1, userId: 1, settings: 1 } } });

    const user = await getUser(userId, { projection: { name: 1, username: 1, avatar: 1, } });

    if(!user) {
        return res.status(404).send({ reason: "deleted" });
    }

    for(let i of restaurant!.staff!) {
        if(i.userId.equals(userId)) {
            return res.send({
                role: i.role,
                settings: i.settings,
                showFire: true,
                user: {
                    name: user.name || user.username,
                    avatar: user.avatar?.binary
                },
            });
        }
    }


    return res.status(404).send({ reason: "staff" });

});
router.post("/:userId/settings", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params;
    const { field, value } = req.body;

    if(!field || !["settings", "customers", "dishes", "ingredients", "staff"].includes(field) || typeof value != "boolean") {
        return res.sendStatus(422);
    }

    const query: any = {};

    query[`staff.$[user].settings.${field}`] = value;
    query[`staff.$[user].lastUpdate.time`] = Date.now();
    query[`staff.$[user].lastUpdate.userId`] = id(req.user as string);

    const update = await Restaurant(restaurantId).update(
        { $set: query },
        { arrayFilters: [ { "user.userId": id(userId) } ] },
    );

    res.send({updated: update.modifiedCount > 0});
});
router.post("/:userId/settings/work", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params;
    const { field, value } = req.body;

    if(!field || !["waiter", "cook"].includes(field) || typeof value != "boolean") {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { settings: 1, userId: 1, } } });

    let worker: Worker | undefined;

    for(let i of restaurant!.staff!) {
        if(i.userId.equals(userId)) {
            worker = i;
            break;
        }
    }

    if(!worker) {
        return res.status(404).send({ reason: "staff" });
    }

    (worker.settings as Settings.ManagerSettings).work[field as keyof Settings.ManagerSettings["work"]] = value as boolean;

    const working = (worker.settings as Settings.ManagerSettings).work.cook || (worker.settings as Settings.ManagerSettings).work.waiter;

    const userUpdate = await updateUser(userId, { $set: { "restaurants.$[restaurant].role": working ? "manager:working" : "manager" } }, { arrayFilters: [ { "restaurant.restaurantId": id(restaurantId) } ] })

    console.log("user role updated: ", userUpdate.modifiedCount > 0);


    const query: any = {};

    query[`staff.$[user].settings.work.${field}`] = value;
    query["staff.$[user].lastUpdate.user"] = id(req.user as string);
    query["staff.$[user].lastUpdate.time"] = Date.now();

    const restaurantUpdate = await Restaurant(restaurantId).update(
        { $set: query },
        { arrayFilters: [ { "user.userId": id(userId) } ] }
    );

    res.send({ updated: restaurantUpdate.modifiedCount > 0 });
});
router.post("/:userId/role", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId, userId } = req.params;
    const { role } = req.body;

    if(!role || !["cook", "manager", "waiter"].includes(role)) {
        return res.sendStatus(422);
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { userId: 1, settings: 1, role: 1, lastManagerSettings: role == "manager" ? 1 : undefined } } });

    let worker: Worker | undefined;

    for(let i of restaurant!.staff!) {
        if(i.userId.equals(userId)) {
            worker = i;
            break;
        }
    }

    if(!worker) {
        return res.status(404).send({ reason: "staff" });
    }
    if(worker.role == role) {
        return res.status(422).send({ reason: "role" });
    }


    const query: any = {};

    query["staff.$[user].role"] = role;

    if(worker.role == "manager") {
        query["staff.$[user].lastManagerSettings"] = worker.settings;
    }
    if(role == "manager") {
        query["staff.$[user].settings"] = worker.lastManagerSettings;
        worker.settings = worker.lastManagerSettings!;
    } else {
        query["staff.$[user].settings"] = {};
    }

    const userUpdate = await updateUser(userId, { $set: { "restaurants.$[restaurant].role": role != "manager" ? role : ((worker.settings as Settings.ManagerSettings).work.cook || (worker.settings as Settings.ManagerSettings).work.waiter) ? "manager:working" : "manager" } }, { arrayFilters: [ { "restaurant.restaurantId": id(restaurantId) } ]  })

    console.log("user role updated: ", userUpdate.modifiedCount > 0);

    const update = await Restaurant(restaurantId).update(
        { $set: query },
        { arrayFilters: [ { "user.userId": id(userId) } ] },
    );

    res.send({updated: update.modifiedCount > 0, settings: role == "manager" ? worker.lastManagerSettings : {} });
});

router.patch("/:userId/fire", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;
    const { text: comment, rating: stars } = req.body;


    const foundWorker = await Restaurant(restaurantId).aggregate<{ worker: any, owner: ObjectId }>([
        // { $match: { _id: id(restaurantId) } },
        { $unwind: "$staff" },
        { $match: { "staff._id": id(userId) } },
        { $project: { worker: "$staff", owner: "$owner" } }
    ]);

    if (!foundWorker || foundWorker.length == 0) {
        console.log("no worker found");
        return res.sendStatus(404);
    }

    const { worker, owner } = foundWorker[0];

    if ((worker._id as ObjectId).equals(req.user as string) || (worker._id as ObjectId).equals(owner)) {
        return res.sendStatus(405);
    }


    const result = await Restaurant(restaurantId).update({ $pull: { staff: { _id: id(userId) } } });



    const newFeedback = {
        _id: id()!,
        restaurantId: id(restaurantId)!,
        comment: comment as string,
        stars: stars as number,
        role: worker.role as string,
        worked: Date.now() - worker.joined
    };


    const result2 = await updateUser(userId, {
        $pull: { restaurants: { restaurantId: id(restaurantId)! } },
        $push: { feedbacks: newFeedback }
    });

    console.log("user fired: ", result!.modifiedCount > 0 && result2.modifiedCount > 0);
    res.send({ updated: result!.modifiedCount > 0 && result2.modifiedCount > 0 });
});





export {
    router as StaffRouter
}