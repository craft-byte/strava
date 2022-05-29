import { Router } from "express";
import { Restaurant } from "../../utils/restaurant";


const router = Router();


router.get("/restaurants", async (_req, res) => {
    const result = await Restaurant().search({  }, { limit: 7 });


    res.send(result);
});




export {
    router as MapRouter
}