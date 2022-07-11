import { Router } from "express";
import { allowed } from "../middleware/restaurant";
import { Restaurant } from "../utils/restaurant";
import { ComponentsRouter } from "./restaurant/components";
import { StaffRouter } from "./restaurant/staff";
import { DishesRouter } from "./restaurant/dishes";
import { UpdateRouter } from "./restaurant/update";
import { getUser, getUsers } from "../utils/users";
import { PeopleRouter } from "./restaurant/people";
import { CustomersRouter } from "./restaurant/customers";
import { userInfo } from "os";
import { SettingsRouter } from "./restaurant/settings";


const router = Router({ mergeParams: true });

router.use("/update", UpdateRouter);
router.use("/dishes", DishesRouter);
router.use("/components", ComponentsRouter);
router.use("/people", PeopleRouter);
router.use("/staff", StaffRouter);
router.use("/customers", CustomersRouter);
router.use("/settings", allowed("manager", "settings"), SettingsRouter);


router.get("/init", allowed("manager"), async (req, res) => {
    const{ restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1 } });

    const user = await getUser(req.user as string, { projection: { restaurants: 1 } });

    const promises = [];

    for(let i of user!.restaurants!) {
        if(!i.equals(restaurantId)) {
            promises.push(Restaurant(i).get({ projection: { name: 1 } } ));
        }
    }

    res.send({ restaurant, restaurants: await Promise.all(promises) });
});



router.patch("/findUsers", async (req, res) => {
    const { searchText } = req.body;

    const users = await getUsers({}, { projection: { name: 1, username: 1, } });

    const ids = [];

    for(let i of users) {
        if(
            i.name?.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()
                ||
            i.username!.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()
        ) {
            ids.push(i._id!);
        }
    }

    const users2 = await getUsers({ _id: { $in: ids } }, { projection: { name: 1, username: 1, avatar: 1 } });

    const result = [];


    for(let i of users2) {
        result.push({
            name: i.name || i.username,
            username: i.username,
            avatar: i.avatar,
            _id: i._id,
        });
    }


    res.send(result);
});
router.get("/user/:userId", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;

    const result = await getUser(userId, { projection: { name: 1, username: 1 } });
    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { _id: 1 } } });
    

    if(result._id!.equals(req.user as any)) {
        return res.send({ works: true });
    }
    for(let i of restaurant!.staff!) {
        if(i._id.equals(userId)) {
            return res.send({ works: true });
        }
    }

    res.send({
        name: result.name || result.username,
        username: result.username,
        _id: result._id,
    });
});


export {
    router as RadminRouter
}