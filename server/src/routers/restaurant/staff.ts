import { Router } from "express";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { logged } from "../../utils/middleware/logged";
import { Locals } from "../../models/other";


const router = Router({ mergeParams: true });



/**
 * @returns list of restaurant staff
 */
router.get("/", logged({ _id: 1 }), allowed({ staff: { joined: 1, userId: 1, role: 1 }, settings: { staff: { mode: 1 } } }, { isOwner: true }), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { restaurant } = res.locals as Locals;


    res.send({ mode: restaurant.settings?.staff.mode });
});





export {
    router as StaffRouter
}