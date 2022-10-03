import { Router } from "express";
import { logged, order } from "../middleware/user";
import { AccountRouter } from "./client/account";
import { MapRouter } from "./client/map";
import { OrderRouter } from "./client/order";


const router = Router();


router.use("/account", AccountRouter);
router.use("/map", MapRouter);
router.use("/order/:restaurantId", order, OrderRouter);


export {
    router as ClientRouter
}