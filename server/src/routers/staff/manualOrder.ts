import { Router } from "express";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { Restaurant } from "../../utils/restaurant";



const router = Router({ mergeParams: true });


router.get("/dishes", logged({ _id: 1 }), allowed({ _id: 1 }, "waiter"), async (req, res) => {
    const { restaurantId } = req.params;
    
    const dishes = await Restaurant(restaurantId).dishes.many({ }).get({ limit: 7, projection: { image: { binary: 1, }, name: 1, price: 1, general: 1, time: 1, } });

    

});



export {
    router as ManualOrderRouter
}