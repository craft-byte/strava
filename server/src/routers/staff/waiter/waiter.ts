import { Router } from "express";
import { Restaurant } from "../../../utils/restaurant";
import { convertDishes } from "./functions";


const router = Router({ mergeParams: true });


router.get("/init", async (req ,res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1  } });

    if(!restaurant) {
        return res.sendStatus(404);
    }

    res.send({
        restaurant,
        ...await convertDishes(restaurantId)
    });
});
router.get("/dish/:dishId", async (req, res) => {
    const { dishId, restaurantId } = req.params as any;

    const result = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { name: 1, image: 1 } });

    res.send(result);
});



export {
    router as WaiterRouter
}