import { Router } from "express";
import { Orders, Restaurant } from "../utils/restaurant";
import { ComponentsRouter } from "./restaurant/components";
import { StaffRouter } from "./restaurant/staff";
import { DishesRouter } from "./restaurant/dishes";
import { PeopleRouter } from "./restaurant/people";
import { CustomersRouter } from "./restaurant/customers";
import { stripe } from "..";
import { DishHashTableUltra } from "../utils/dish";
import { logged } from "../utils/middleware/logged";
import { allowed } from "../utils/middleware/restaurantAllowed";
import { Locals } from "../models/other";
import { SettingsRouter } from "./restaurant/settings";
import { Settings } from "../models/components";


const router = Router({ mergeParams: true });

router.use("/dishes", DishesRouter);
router.use("/components", ComponentsRouter);
router.use("/people", PeopleRouter);
router.use("/staff", StaffRouter);
router.use("/customers", CustomersRouter);
router.use("/settings", SettingsRouter);


router.get("/check", logged({ restaurants: { role: 1, restaurantId: 1 } }), allowed({ name: 1, status: 1, staff: 1, }, "manager"), async (req, res) => {
    res.send(true);
    // const{ restaurantId } = req.params;
    // const { restaurant, user } = res.locals as Locals;

    // // const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, status: 1 } });
    // // const user = await getUser(req.user as string, { projection: { restaurants: { restaurantId: 1, role: 1 } } });



    // console.log(workAs!);
    // res.send({ workAs: workAs!, restaurant, restaurants: await Promise.all(promises) });
});




/**
 * 
 * data for restaurant/home.page
 * card payments status
 * payouts status
 * 
 */
interface ReviewResult {
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
}; router.get("/home", logged({ restaurants: 1 }), allowed({ settings: { money: 1 } }, "owner"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { restaurant, user } = res.locals as Locals;

    // const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1 } });
    // const user = await getUser(req.user as string, { projection: { restaurants: 1 } });


    if(!restaurant.settings?.money) {
        throw "NO restaurant.money property at /restaurant/home";
    }
    
    const result: ReviewResult = {
        money: {
            cash: restaurant.settings.money.cash,
            card: restaurant.settings.money.card,
            payouts: restaurant.settings.money.payouts,
        }
    };



    for (let i of user.restaurants) {
        if (i.role == "owner" && i.restaurantId.equals(restaurantId)) {

            if(!i.stripeAccountId) {
                console.error("at GET /restaurant/home no stripeAccountId");
                throw "at GET /restaurant/home no stripeAccountId";
                break;
            }

            const account = await stripe.accounts.retrieve(i.stripeAccountId!);
            
            if(!account) {
                break;
            }

            if(!account.requirements) {
                break;
            }

            const { disabled_reason: status } = account.requirements!;

            if(!account.payouts_enabled && account.requirements!.currently_due!.length == 0) {
                result.money!.payouts = "pending";
                const update = await Restaurant(restaurantId).update({ $set: { "money.payouts": "pending" } });

                console.log("payouts set to pending: ", update!.ok == 0);
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

                        console.log("payouts set to restricted: ", update!.ok == 0);
                    }
                }
            }

            result.status = status!;

            if(status != "rejected.other" && account.requirements?.eventually_due && account.requirements?.eventually_due.length > 0) {
                result.status = "requirements.eventually_due";
                for(let i of account.requirements.eventually_due) {
                    switch (i) {
                        case "individual.verification.document":
                            result.nextEventuallyUrl = `document`;
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



/**
 * charts data for restaurant/home.page
 * 
 * @throws { status: 403; reason: "RestaurantNotEnabled" }
 */
interface Chart {
    name: string;
    series: {
        value: number;
        name: string;
    }[];
}; router.get("/charts", logged({ _id: 1 }), allowed({ status: 1 }, "manager"), async (req, res) => {
    const { restaurantId } = req.params;
    const { restaurant } = res.locals as Locals;

    // const restaurant = await Restaurant(restaurantId).get({ projection: { status: 1 } });

    if(restaurant!.status != "disabled" && restaurant!.status != "enabled") {
        return res.status(403).send({ reason: "RestaurantNotEnabled" });
    }

    const weekAgo = Date.now() - 604800000;

    const orders = await (await Orders(restaurantId).history.many({ ordered: { $gte: weekAgo } }, { projection: { ordered: 1, dishes: { dishId: 1 }, money: 1, } })).toArray();

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
        result[day] += order.money!.subtotal;
        // for(let { dishId, price } of order.dishes) {
        //     if(price) {
        //         result[day] += price;
        //     } else {
        //         const dish = await dishes.get(dishId);
        //         if(dish) {
        //             result[day] += dish.price!;
        //         }
        //     }
        // }
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


router.get("/restaurant-status", logged({ _id: 1, restaurants: 1, }), allowed({ status: 1, name: 1, stripeAccountId: 1, cache: 1, settings: { staff: 1 } }, "owner"), async (req, res) => {
    const { restaurant, user } = res.locals as Locals;

    if(!restaurant.cache || !restaurant.cache.requirements) {
        const account = await stripe.accounts.retrieve(restaurant.stripeAccountId!);
        restaurant.cache = { ...restaurant.cache, requirements: account.requirements!.currently_due! };
    }

    let verificationUrl: string;
    if(restaurant.cache?.requirements) {
        for (let i of restaurant.cache.requirements) {
            switch (i) {
                case "external_account":
                    verificationUrl = `bank-account`;
                    break;
                case "individual.address.city":
                    verificationUrl = `address`;
                    break;
                case "individual.address.line1":
                    verificationUrl = `address`;
                    break;
                case "individual.address.postal_code":
                    verificationUrl = `address`;
                    break;
                case "individual.address.state":
                    verificationUrl = `address`;
                    break;
                case "individual.dob.day":
                    verificationUrl = `dob`;
                    break;
                case "individual.first_name":
                    verificationUrl = `name`;
                    break;
                case "individual.last_name":
                    verificationUrl = `name`;
                    break;
            }
        }
    }

    const promises = [];

    let workAs: string;
    for(let i of user!.restaurants!) {
        if(!i.restaurantId.equals(restaurant._id)) {
            promises.push(Restaurant(i.restaurantId).get({ projection: { name: 1 } } ));
        } else {
            if(i.role == "manager:working" || i.role == "owner") {
                workAs = "both";
                break;
            } else {
                for(let i of restaurant.staff!) {
                    if(i.userId.equals(user._id)) {
                        if(i.role == "manager") {
                            if((i.settings as Settings.ManagerSettings).work.cook && (i.settings as Settings.ManagerSettings).work.waiter) {
                                workAs = "both";
                            } else if((i.settings as Settings.ManagerSettings).work.cook) {
                                workAs = "cook"
                            } else if((i.settings as Settings.ManagerSettings).work.waiter) {
                                workAs = "waiter";
                            } else {
                                workAs = null!;
                            }
                            break;
                        } else {
                            workAs = i.role;
                        }
                        break;
                    }
                }
            }
        }
    }

    res.send({ verificationUrl: verificationUrl!, mode: restaurant.settings?.staff.mode, restaurant: { name: restaurant.name, status: restaurant.staff, _id: restaurant._id }, workAs: workAs!, restaurants: await Promise.all(promises) });
});


/**
 * delete restaurant
 * for development only
 * should be reconsidered
 */
router.delete("/", logged({ _id: 1, }), allowed({ owner: 1, staff: 1, stripeAccountId: 1 }, "owner"), async (req, res) => {
    const { restaurantId } = req.params;
    const { restaurant } = res.locals as Locals;

    // const restaurant = await Restaurant(restaurantId).get({ projection: { owner: 1, staff: 1, stripeAccountId: 1 } });


    if(!restaurant.stripeAccountId) {
        throw "error at DELETE /restaurant no restaurant.stripeAccountId property";
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



interface QRCodesResult {
    link: string;
    tables: { index: number; link: string; }[];
}
router.get("/qr-codes", logged({ _id: 1 }), allowed({ tables: 1 }, "manager"), async (req, res) => {
    const { restaurant, } = res.locals as Locals;


    const result: QRCodesResult = {
        link: `${req.protocol}://${req.get("host")}/customer/order/${restaurant._id.toString()}`,
        tables: []
    }


    for(let i = 0; i < restaurant!.tables!; i++) {
        result.tables.push({
            index: i + 1,
            link: `${req.protocol}://${req.get("host")}/customer/order/${restaurant!._id.toString()}?table=${i + 1}`,
        });
    }

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


    res.send({ updated: result!.ok == 1, link: `${req.headers.origin}/customer/order/${restaurantId}?table=${result.restaurant?.tables}`, index: result.restaurant.tables });
});


export {
    router as RadminRouter
}