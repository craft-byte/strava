import { Router, urlencoded } from "express";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });



router.get("/", async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { settings: 1 } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    res.send(restaurant?.settings);
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


export {
    router as SettingsRouter,
}