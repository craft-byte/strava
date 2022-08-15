import { Router, urlencoded } from "express";
import { stripe } from "../..";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });



router.get("/", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { settings: 1, money: 1, stripeAccountId: 1 } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    const result = await stripe.accounts.listExternalAccounts(restaurant.stripeAccountId);

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
router.post("/", async (req, res) => {
    const { field1, field2, value } = req.body;
    const { restaurantId } = req.params as any;

    if(!field1 || !field2) {
        return res.sendStatus(422);
    }

    const query: any = {};

    query[`settings.${field1}.${field2}`] = value;

    const result = await Restaurant(restaurantId).update({ $set: query });

    console.log("updated: ", result!.modifiedCount > 0);

    res.send({ updated: result!.modifiedCount > 0 });
});

router.post("/cash", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { value } = req.body;

    const result = await Restaurant(restaurantId)
        .update({ $set: { "money.cash": value ? "enabled" : "disabled" } });

    res.send({ updated: result!.modifiedCount > 0 });
});
router.post("/card", async (req, res) => {
    const { restaurantId } = req.params as any;
    const { value } = req.body;

    const restaurant = await Restaurant(restaurantId).get({ projection: { money: 1 } });

    if(restaurant!.money.card == "enabled" || restaurant!.money.card == "disabled") {
        const update = await Restaurant(restaurantId).update({ $set: { "money.card": value ? "enabled" : "disabled" } });

        return res.send({ updated: update!.modifiedCount > 0 });
    }

    res.sendStatus(403);
});


export {
    router as SettingsRouter,
}