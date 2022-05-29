import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../middleware/restaurant";
import { Invitation } from "../../models/components";
import { getDate, id, log } from "../../utils/functions";
import { getWorked } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";
import { getUser, getUsers, updateUser } from "../../utils/users";


const router = Router({ mergeParams: true });


router.post("/", allowed("manager", "staff", "hire"), async (req, res) => {
    const { restaurantId } = req.params;
    const { role, userId, settings } = req.body;

    const isWorks = await Restaurant().aggregate([
        { $match: { _id: id(restaurantId) } },
        { $unwind: "$staff" },
        { $match: { "staff._id": id(userId) } },
        { $project: { found: "hello" } }
    ]);

    if (isWorks.length > 0) {
        return res.send({ error: "user", acknowledged: false });
    }


    const invitationId = id();

    const restaurantInviting: Invitation = {
        _id: invitationId!,
        userId: id(userId)!,
        date: new Date(),
        role: role,
        settings: settings || null
    }
    const userInviting: Invitation = {
        _id: invitationId!,
        restaurantId: id(restaurantId)!,
        date: new Date(),
        role: role,
    }


    const changes = await Restaurant(restaurantId).update({ $push: { invitations: restaurantInviting } });
    const changes2 = await updateUser(userId, { $push: { invitations: userInviting } });

    console.log("user invited: ", changes!.modifiedCount > 0, changes2.modifiedCount > 0);

    res.send({ done: changes!.modifiedCount > 0 });
});
router.get("/", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId } = req.params as any;


    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { joined: 1, _id: 1, role: 1 } } })

    const ids: ObjectId[] = [];

    for (let i of restaurant?.staff!) {
        ids.push(i._id);
    }

    const users = await getUsers({ _id: { $in: ids } }, { projection: { name: 1, avatar: 1, username: 1 } });


    const result = [];

    if (restaurant?.staff?.length != users.length) {
        return res.sendStatus(404);
    }

    for (let i in users) {
        result.push({
            ...users[i],
            date: getDate(restaurant.staff[i].joined),
            role: restaurant.staff[i].role
        });
    }


    res.send(result);
});
router.get("/:userId", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;

    const result1 = await getUser(userId, { projection: { avatar: 1, name: 1, username: 1, email: 1, } });

    let result2 = await Restaurant().aggregate<{ worker: any }>([
        { $match: { _id: id(restaurantId) } },
        { $unwind: "$staff" },
        { $match: { "staff._id": id(userId) } },
        { $project: { worker: "$staff" } }
    ]);

    let worker;

    if (!result2 || result2.length == 0) {
        worker = null;
        return res.send(null);
    } else {
        worker = result2[0].worker;
    }

    worker.joined = getDate(worker.joined);
    worker.role = worker.role[0].toUpperCase() + worker.role.slice(1, worker.role.length);

    res.send({ user: worker ? result1 : null, worker });
});
router.patch("/:userId/fire", allowed("manager", "staff", "fire"), async (req, res) => {
    const { userId, restaurantId } = req.params;
    const { text: comment, rating: stars } = req.body;

    const feedback = {
        comment, stars
    };


    const foundWorker = await Restaurant().aggregate<{ worker: any, owner: ObjectId }>([
        { $match: { _id: id(restaurantId) } },
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
        restaurant: id(restaurantId),
        feedback,
        role: worker.role,
        worked: getWorked(worker.joined)
    };


    const result2 = await updateUser(userId, {
        $pull: { works: id(restaurantId), restaurants: id(restaurantId) },
        $push: { feedbacks: newFeedback }
    });

    console.log("user fired: ", result!.modifiedCount > 0 && result2.modifiedCount > 0);
    res.send({ updated: result!.modifiedCount > 0 && result2.modifiedCount > 0 });
});
router.get("/invitations/get", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { invitations: 1, name: 1 } });

    if (!restaurant) {
        return res.sendStatus(404);
    }

    const result: {
        date: string;
        _id: any;
        restaurantId: any;
        userId: any;
        role: string;
        user: {
            name: string;
            username: string;
        }
    }[] = [];

    for (let i of restaurant.invitations!) {
        result.push({
            date: getDate(i.date),
            _id: i._id!,
            restaurantId,
            role: i.role!,
            userId: i.userId,
            user: await getUser(i.userId!, { projection: { name: 1, username: 1 } }) as any,
        });
    }

    res.send(result);
});
router.delete("/invitations/:invId/:userId", allowed("manager", "staff", "hire"), async (req, res) => {
    const { restaurantId, invId, userId } = req.params;

    const changes1 = await Restaurant(restaurantId).update(
        { $pull: { invitations: { _id: id(invId) } } }
    );

    const changes2 = await updateUser(
        userId,
        { $pull: { invitations: { _id: id(invId) } } }
    );


    res.send({ removed: changes1!.modifiedCount > 0 && changes2.modifiedCount > 0 });
});






router.post("/:userId/settings/update", allowed("manager", "staff", "settings"), async (req, res) => {
    const { userId, restaurantId } = req.params;
    const { f1, f2, value } = req.body;

    const update: any = { $set: {} };

    update.$set[`staff.$[user].settings.${f1}.${f2}`] = value;

    const result = await Restaurant(restaurantId).update(update, { arrayFilters: [{ "user._id": id(userId) }] });

    console.log("worker setting changed: ", result!.modifiedCount > 0);

    return result;
});




export {
    router as StaffRouter
}