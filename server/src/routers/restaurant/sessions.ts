import { ObjectId } from "bson";
import { Router } from "express";
import { OrderStatus, OrderType } from "../../models/Order";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { Orders } from "../../utils/orders";


const router = Router({ mergeParams: true });



router.get("/", logged({ _id: 1, }), allowed({ _id: 1 }, { isOwner: true }), async (req, res) => {
    const { restaurantId } = req.params;



    const sessions = await Orders(restaurantId).many({}, { projection: {
        // customer: 1,
        // customerToken: 1,
        dishes: { dishId: 1 },
        connected: 1,
        status: 1,
        type: 1,
        id: 1,
    } });




    const result: {
        _id: ObjectId;
        status: OrderStatus;
        type: OrderType;
        id: string;
        dishesAmount: number;
    }[] = [];



    for(let session of sessions) {
        result.push({
            _id: session._id,
            status: session.status,
            type: session.type,
            id: session.id,
            dishesAmount: session.dishes.length
        });
    }


    res.send(result);
});






export {
    router as SessionsRouter
}