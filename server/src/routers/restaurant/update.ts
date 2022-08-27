import { Router } from "express";
import { allowed } from "../../middleware/restaurant";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });



router.patch("/name", allowed("manager", "settings"),  async (req, res) => {
    const { restaurantId } = req.params;
    const { name } = req.body;

    const result = await Restaurant(restaurantId).update({ $set: { name } });

    res.send({
        updated: result!.modifiedCount > 0
    });
});


export {
    router as UpdateRouter
}