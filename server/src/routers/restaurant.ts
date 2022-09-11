import { Router } from "express";
import { allowed } from "../middleware/restaurant";
import { Orders, Restaurant } from "../utils/restaurant";
import { ComponentsRouter } from "./restaurant/components";
import { StaffRouter } from "./restaurant/staff";
import { DishesRouter } from "./restaurant/dishes";
import { UpdateRouter } from "./restaurant/update";
import { getUser, getUsers } from "../utils/users";
import { PeopleRouter } from "./restaurant/people";
import { CustomersRouter } from "./restaurant/customers";
import { SettingsRouter } from "./restaurant/settings";
import { stripe } from "..";
import { DishHashTableUltra } from "../utils/dish";


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

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, status: 1 } });


    const user = await getUser(req.user as string, { projection: { restaurants: { restaurantId: 1, role: 1 } } });

    const promises = [];

    let showGoWork = false;
    for(let i of user!.restaurants!) {
        if(!i.restaurantId.equals(restaurantId)) {
            promises.push(Restaurant(i.restaurantId).get({ projection: { name: 1 } } ));
        } else {
            if(i.role == "manager:working" || i.role == "owner") {
                showGoWork = true;
                break;
            }
        }
    }
    res.send({ showGoWork, restaurant, restaurants: await Promise.all(promises) });
});




interface ReviewResult {
    nextUrl?: string;
    nextEventuallyUrl?: string;
    status?: string;
    payouts?: {
        last4?: string;
        currency?: string;
        status?: string;
    };
    money?: {
        card: "rejected" | "enabled" | "pending" | "disabled" | "restricted";
        cash: "enabled" | "disabled";
        payouts: "enabled" | "restricted" | "pending" | "rejected";
    };
}; router.get("/home", allowed("manager"), async (req, res) => {
    const { restaurantId } = req.params as any;
    
    const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1 } });
    
    
    if(!restaurant) {
        return res.sendStatus(404);
    }
    
    const result: ReviewResult = {
        money: {
            cash: restaurant.money.cash,
            card: restaurant.money.card,
            payouts: restaurant.money.payouts,
        }
    };


    const user = await getUser(req.user as string, { projection: { restaurants: 1 } });


    if (!user!.restaurants) {
        return res.sendStatus(404);
    }

    for (let i of user!.restaurants) {
        if (i.role == "owner" && i.restaurantId.equals(restaurantId)) {

            const account = await stripe.accounts.retrieve(i.stripeAccountId!);
            
            if(!account) {
                break;
            }

            const { disabled_reason: status } = account.requirements!;

            if(!account.payouts_enabled && account.requirements!.currently_due!.length == 0) {
                result.money!.payouts = "pending";
                const update = await Restaurant(restaurantId).update({ $set: { "money.payouts": "pending" } });

                console.log("payouts set to pending: ", update!.modifiedCount > 0);
            }

            if(!account.external_accounts) {
                break;
            }

            for(let i of account.external_accounts!.data) {
                if(i.default_for_currency) {
                    result.payouts = {};
                    result.payouts!.last4 = i.last4;
                    result.payouts!.currency = i.currency!;
                    result.payouts!.status = i.status!;

                    if(status == "verification_failed" || status == "errored") {
                        result.money!.payouts = "restricted";
                        const update = await Restaurant(restaurantId).update({ $set: { "money.payouts": "restricted" } });

                        console.log("payouts set to restricted: ", update!.modifiedCount > 0);
                    }
                }
            }

            if(status == "requirements.past_due") {
                if(result.money?.card == "enabled") {
                    console.log("CASE: restaurant has not finished registration but card payments are enabled");
                }
                for (let i of account.requirements?.currently_due!) {
                    switch (i) {
                        case "external_account":
                            result.nextUrl = `add-restaurant/${restaurantId}/choose-method`;
                            break;
                        case "individual.address.city":
                            result.nextUrl = `add-restaurant/${restaurantId}/address`;
                            break;
                        case "individual.address.line1":
                            result.nextUrl = `add-restaurant/${restaurantId}/address`;
                            break;
                        case "individual.address.postal_code":
                            result.nextUrl = `add-restaurant/${restaurantId}/address`;
                            break;
                        case "individual.address.state":
                            result.nextUrl = `add-restaurant/${restaurantId}/address`;
                            break;
                        case "individual.dob.day":
                            result.nextUrl = `add-restaurant/${restaurantId}/dob`;
                            break;
                        case "individual.first_name":
                            result.nextUrl = `add-restaurant/${restaurantId}/name`;
                            break;
                        case "individual.last_name":
                            result.nextUrl = `add-restaurant/${restaurantId}/name`;
                            break;
                    }
                }
            }

            result.status = status!;

            if(status != "rejected.other" && account.requirements?.eventually_due && account.requirements?.eventually_due.length > 0) {
                result.status = "requirements.eventually_due";
                for(let i of account.requirements.eventually_due) {
                    switch (i) {
                        case "individual.verification.document":
                            result.nextEventuallyUrl = `add-restaurant/${restaurantId}/document`;
                            break;
                    }
                }

            }





            break;
        }
    }


    if(restaurant.status == "enabled") {

    }

    res.send(result);
});



interface Chart {
    name: string;
    series: {
        value: number;
        name: string;
    }[];
}; router.get("/charts", allowed("manager"), async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { status: 1 } });

    if(restaurant!.status != "disabled" && restaurant!.status != "enabled") {
        return res.status(403).send({ reason: "status" });
    }

    const weekAgo = Date.now() - 604800000;

    const orders = await (await Orders(restaurantId).history.many({ ordered: { $gte: weekAgo } }, { projection: { ordered: 1, dishes: { dishId: 1 } } })).toArray();

    if(orders.length == 0) {
        return res.send(null);
    }

    const dishes = new DishHashTableUltra(restaurantId, { price: 1 });

    const result: any = {};

    const firstWeekDay = new Date().getDate();
    for(let i = 0; i < 7; i++) {
        result[firstWeekDay - i] = null;
    }

    for(let order of orders.reverse()) {
        const day = new Date(order.ordered!).getDate();
        if(!result[day]) {
            result[day] = 0;
        }
        for(let { dishId, price } of order.dishes) {
            if(price) {
                result[day] += price;
            } else {
                const dish = await dishes.get(dishId);
                if(dish) {
                    result[day] += dish.price!;
                }
            }
        }
    }


    const converted: Chart = {
        name: "This week",
        series: [],
    };

    for(let i of Object.keys(result)) {
        converted.series.push({
            name: i,
            value: result[i] / 100,
        });
    }

    return res.send(converted);
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

    const user = await getUser(userId, { projection: { name: 1, username: 1 } });
    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { userId: 1 } } });
    

    if(user!._id!.equals(req.user as any)) {
        return res.send({ works: true });
    }
    for(let i of restaurant!.staff!) {
        if(i.userId.equals(userId)) {
            return res.send({ works: true });
        }
    }

    res.send({
        name: user!.name || user!.username,
        username: user!.username,
        _id: user!._id,
    });
});

router.delete("/", allowed("owner"), async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { owner: 1, staff: 1, stripeAccountId: 1 } });


    if(!restaurant) {
        return res.sendStatus(404);
    } else if(!restaurant.owner?.equals(req.user as string)) {
        return res.sendStatus(403);
    }

    try {
        const stripeUpdate = await stripe.accounts.del(restaurant.stripeAccountId);

        console.log("stripe account removed: ", stripeUpdate.deleted);
    } catch (e) {
        throw e;
    }

    const result = await Restaurant(restaurantId).remove();

    
    res.send({ removed: result });
});


export {
    router as RadminRouter
}