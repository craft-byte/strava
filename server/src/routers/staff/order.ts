import { Router } from "express";
import { DishHashTableUltra } from "../../utils/dish";
import { id } from "../../utils/functions";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../utils/other";
import { Orders } from "../../utils/restaurant";
import { getUser } from "../../utils/users";



const router = Router({ mergeParams: true });


router.get("/:orderId", logged({ _id: 1 }), allowed({ _id: 1, }, "staff"), async (req, res) => {
    const { restaurantId, orderId } = req.params;


    const result = await Orders(restaurantId).one({ _id: id(orderId), status: "progress" }).get({ projection: { customer: 1, status: 1, id: 1, type: 1, ordered: 1, comment: 1, dishes: { dishId: 1, status: 1, _id: 1, comment: 1, id: 1, taken: 1, cooked: 1, } } });

    if(!result) {
        res.send(null);
    }

    const dishes = new DishHashTableUltra(restaurantId, { name: 1, info: { time: 1, }, image: { binary: 1, } });
    for(let i of result.dishes) {
        await dishes.get(i.dishId);
    }

    const order: any = {};

    if(result.customer) {
        const user = await getUser(result.customer, { projection: { name: { first: 1, }, avatar: { binary: 1, }, } });
        order.customer = {
            name: user?.name?.first || "User deleted",
            avatar: user?.avatar?.binary || null,
            _id: result.customer,
        };
    } else {
        order.customer = {
            name: "Anonymous",
            avatar: null,
            _id: null,
        };
    }

    order.type = result.type;
    order._id = result._id;
    order.id = result.id;
    order.status = result.status;
    order.comment = result.comment;
    order.ordered = getDelay(result.ordered!);

    order.dishes = result.dishes;


    res.send({ order, dishes: dishes.table });
});



export {
    router as OrderRouter,
}