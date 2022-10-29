import { Router } from "express";
import { stripe } from "../..";
import { Locals } from "../../models/other";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });


/**
 * 
 * GET /restaurant/settings
 * returns restaurant settings
 * 
 */
router.get("/", logged({ _id: 1, }), allowed({ settings: 1, name: 1, money: 1, stripeAccountId: 1, info: 1, status: 1, }, "manager", "settings"), async (req, res) => {
    const { restaurant } = res.locals as Locals;

    if(!restaurant) {
        return res.sendStatus(404);
    }

    const result = await stripe.accounts.listExternalAccounts(restaurant.stripeAccountId!);

    let payoutDestination: any = null;

    if(result.data[0]) {
        payoutDestination = {};
        payoutDestination.last4 = result.data[0].last4;
        payoutDestination.currency = result.data[0].currency;
        payoutDestination.status = result.data[0].status;
        payoutDestination.routing = (result.data[0] as any).routing_number;
        payoutDestination.bank = (result.data[0] as any).bank_name;
    }

    let time: any;
    if(restaurant.info?.time) {
        time = {};
        const cm = restaurant.info.time.closes.minutes.toString().length == 1 ? `0${restaurant.info.time.closes.minutes}` : restaurant.info.time.closes.minutes;
        const om = restaurant.info.time.opens.minutes.toString().length == 1 ? `0${restaurant.info.time.opens.minutes}` : restaurant.info.time.opens.minutes;

        time.opens = { ...restaurant.info.time.opens, minutes: om };
        time.closes = { ...restaurant.info.time.closes, minutes: cm };

        if(time.opens.half == "PM") {
            time.opens.hours = restaurant.info.time.opens.hours - 12;
        }
        if(time.closes.half == "PM") {
            time.closes.hours = restaurant.info.time.closes.hours - 12;
        }
    }

    res.send({
        payoutDestination,
        settings: restaurant?.settings,
        money: restaurant.money,
        restaurant: { name: restaurant.name, ...restaurant.info, time, status: restaurant.status, },
    });
});



/**
 * change settings
 * 
 * @param { string } field1 - field 1 ex. customers
 * @param { string } field2 - field 2 ex. maxOrdersPrice
 * @param { any } value - value of a setting ex. 'unlimited'
 * 
 */
router.post("/", logged({ _id: 1, }), allowed({ _id: 1 }, "manager", "settings"), async (req, res) => {
    const { field1, field2, value } = req.body;
    const { restaurantId } = req.params as any;

    if(!field1 || !field2) {
        return res.sendStatus(422);
    }

    const query: any = {};

    query[`settings.${field1}.${field2}`] = value;

    const result = await Restaurant(restaurantId).update({ $set: query });

    res.send({ updated: result!.ok == 1 });
});


/**
 * enable or disable cash payment
 */
router.post("/cash", logged({ _id: 1, }), allowed({ _id: 1 }, "manager", "settings"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { value } = req.body;

    const result = await Restaurant(restaurantId)
        .update({ $set: { "money.cash": value ? "enabled" : "disabled" } });

    res.send({ updated: result!.ok == 1 });
});

/**
 * disable or enable card payment
 */
router.post("/card", logged({ _id: 1, }), allowed({ money: 1 }, "manager", "settings"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { value } = req.body;
    const { restaurant } = res.locals as Locals;

    if(restaurant!.money!.card == "enabled" || restaurant!.money!.card == "disabled") {
        const update = await Restaurant(restaurantId).update({ $set: { "money.card": value ? "enabled" : "disabled" } });

        return res.send({ updated: update!.ok == 1 });
    }

    res.sendStatus(403);
});


/**
 * changes restaurant name
 * 
 * @param { string } name - new restaurant name
 * 
 * @returns { success: boolean; }
 * 
 * @throws { status: 422; reason: "InvalidInput" } - name is not provided or is invalid
 * @throws { status: 403; reason: "NamesAreTheSame" } - new name and old name are the same
 */
router.post("/name", logged({ _id: 1, }), allowed({ name: 1, }, "manager", "settings"), async (req, res) => {
    const { restaurant } = res.locals;
    const { name } = req.body;

    if(!name || typeof name != "string") {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    if(restaurant.name == name) {
        return res.status(403).send({ reason: "NamesAreTheSame" });
    }

    const update = await Restaurant(restaurant._id).update({ $set: { name: name.trim() } });

    res.send({ success: update.ok == 1 });
});


/**
 * changes restaurant description
 * 
 * @param { string } description - new description
 * 
 * @throws { status: 422; reason: "InvalidDescription" } - description is invalid
 * @throws { status: 403; reason: "SameDescription" } - description is the same as old one
 * 
 * @returns { success: boolean; }
 */
router.post("/description", logged({ _id: 1 }), allowed({ info: { description: 1 }, }, "manager", "settings"), async (req, res) => {
    const { restaurant } = res.locals as Locals;
    const { description } = req.body;

    if(!description || typeof description != "string") {
        return res.status(422).send({ reason: "InvalidDescription" });
    }

    if(restaurant.info && restaurant.info.description && restaurant.info?.description == description) {
        return res.status(403).send({ reason: "SameDescription" });
    }

    const update = await Restaurant(restaurant._id).update({ $set: { "info.description": description.trim() }});

    res.send({ success: update.ok == 1 });
});


/**
 * changes restaurants open and close time
 * 
 * @param { half: string; hours: number; minutes: number; } opens - time restaurant opens
 * @param { half: string; hours: number; minutes: number; } closes - time restaurant closes
 * 
 * @throws { status: 422; reason: "InvalidInput" } - invalid input
 * 
 * @returns { success: boolean; }
 */
router.post("/time", logged({ _id: 1, }), allowed({ _id: 1, }, "manager", "settings"), async (req, res) => {
    const { opens, closes } = req.body;
    const { restaurantId } = req.params;

    if(
        !opens ||
        !closes ||
        !opens.hours ||
        !closes.hours ||
        typeof opens.hours != "number" ||
        typeof closes.hours != "number" ||
        typeof opens.minutes != "number" ||
        typeof closes.minutes != "number" ||
        !opens.half ||
        !["AM", "PM"].includes(opens.half) ||
        !closes.half ||
        !["AM", "PM"].includes(closes.half) ||
        opens.hours > 12 ||
        closes.hours > 12 ||
        opens.hours < 1 ||
        closes.hours < 1 ||
        opens.minutes > 60 ||
        closes.minutes > 60 ||
        opens.minutes < 0 ||
        closes.minutes < 0 ||
        (closes.half == opens.half && (closes.hours == opens.hours ? closes.minutes < opens.minutes : closes.hours < opens.hours))
    ) {
        return res.status(422).send({ reason: "InvalidInput" });
    }

    const newTime: any = {
        opens: {
            hours: opens.hours,
            minutes: opens.minutes,
            half: opens.half
        },
        closes: {
            hours: closes.hours,
            minutes: closes.minutes,
            half: closes.half
        }
    };

    if(opens.half == "PM") {
        newTime.opens.hours = opens.hours + 12;
    }
    if(closes.half == "PM") {
        newTime.closes.hours = closes.hours + 12;
    }

    const update = await Restaurant(restaurantId).update({ $set: { "info.time": newTime } }, { projection: { _id: 1 } });


    res.send({ success: update.ok == 1 });
});


export {
    router as SettingsRouter,
}