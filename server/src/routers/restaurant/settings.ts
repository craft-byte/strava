import { Router, urlencoded } from "express";
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
router.get("/", logged({ _id: 1, }), allowed({ settings: 1, money: 1, stripeAccountId: 1, }, "manager", "settings"), async (req, res) => {
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

    res.send({
        payoutDestination,
        settings: restaurant?.settings,
        money: restaurant.money
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


export {
    router as SettingsRouter,
}