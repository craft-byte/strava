import { Router } from "express";
import { logged, order } from "../middleware/user";
import { AccountRouter } from "./client/account";
import { MapRouter } from "./client/map";
import { OrderRouter } from "./client/order";


const router = Router();


router.use("/account", logged, AccountRouter);
router.use("/map", logged, MapRouter);
router.use("/order/:restaurantId", logged, order, OrderRouter);


export {
    router as ClientRouter
}