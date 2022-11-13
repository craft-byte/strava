import { Router } from "express";
import { Order } from "../../models/general";
import { Locals } from "../../models/other";
import { id } from "../../utils/functions";
import { sendMessage } from "../../utils/io";
import { logged } from "../../utils/middleware/logged";
import { allowed } from "../../utils/middleware/restaurantAllowed";
import { getDelay } from "../../utils/other";
import { Orders, Restaurant } from "../../utils/restaurant";



const router = Router({ mergeParams: true });


router.get("/init", logged({ _id: 1 }), allowed({ _id: 1, settings: { customers: 1, } }, "staff"), async (req, res) => {
    const { restaurantId } = req.params;
    const { restaurant } = res.locals as Locals;
    
    const dishes = await Restaurant(restaurantId).dishes.many({ }).get({ projection: { image: { binary: 1, }, name: 1, price: 1, general: 1, info: { time: 1 }, } });

    const order = await Orders(restaurantId).one({  })

    res.send({
        dishes,
        settings: restaurant.settings?.customers,
    });
});


// router.post("/confirm-order", logged({ _id: 1, }), allowed({ _id: 1, }, "staff"), async (req, res) => {
//     const { dishes, comment, type } = req.body;
//     const { restaurantId } = req.params;


//     const orderDishes: Order["dishes"] = [];

//     for(let i of dishes) {
//         for(let c = 0; c < i.amount; c++) {
//             orderDishes.push({
//                 _id: id()!,
//                 dishId: i._id,
//                 status: "ordered",
//                 comment: null!,
//             });
//         }
//     }

//     const orderId = id()!;

//     const result = await Orders(restaurantId).createSession({
//         _id: orderId,
//         status: "progress",
//         comment,
//         dishes: orderDishes,
//         socketId: null!,
//         customer: null!,
//         id: null!,
//         type: null!,
//         ordered: Date.now(),
//     });


//     res.send({ success: result });

//     const forKitchen = [];
//     const time = getDelay(Date.now());
//     for (let i in orderDishes!) {
//         forKitchen.push({
//             orderId: orderId,
//             ...orderDishes![i],
//             time,
//         });
//     }


//     sendMessage([`${restaurantId}/kitchen`], "kitchen", {
//         type: "kitchen/order/new",
//         event: "kitchen",
//         data: forKitchen,
//     });
// });



export {
    router as ManualOrderRouter
} 