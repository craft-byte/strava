import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "..";
import * as e from "express";
import { Orders, Restaurant } from "../utils/restaurant";
import { id } from "../utils/functions";
import { sendMessage } from "../utils/io";
import { getDelay } from "../utils/other";
import { updateUser } from "../utils/users";


const router = Router();


// const endpointSecret = "whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24";
// not test     whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24
router.post("/webhook", e.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;

    // try {
    //     event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    // } catch (err: any) {
    //     console.log(err.message);
    //     res.status(400).send(`Webhook Error: ${err.message}`);
    //     return;
    // }

    console.log(event.type);



    if (event.type == "account.updated") {
        const data = event.data.object as Stripe.Account;


        if (data.requirements?.disabled_reason) {
            // update restaurant

            if (data.requirements?.disabled_reason.split(".")[0] == "rejected") {
                const restaurantUpdate = await Restaurant(data.metadata?.restaurantId as string)
                    .update({
                        $set: {
                            "status": "disabled",
                            "money.card": "rejected"
                        }
                    });
            }


        }

    } else if (event.type == "capability.updated") {
        const data = event.data.object as Stripe.Capability;

        if (data.id == "transfers" || data.id == "card") {
            let account = data.account as Stripe.Account;
            if (typeof data.account == "string") {
                try {
                    account = await stripe.accounts.retrieve(data.account);
                } catch (error: any) {
                    console.log(error);
                    if (error.raw.code == "account_invalid") {
                        return res.sendStatus(200);
                    }
                    return res.sendStatus(501);
                }
            }

            let status = "pending";

            switch (data.status) {
                case "active":
                    status = "enabled";
                    break;
                case "disabled":
                    status = "restricted";
                    break;
                default:
                    status = "restricted";
                    break;
            }


            // console.log(account.requirements!.currently_due);

            // if(account.requirements!.currently_due!.length > 0) {
            //     status = "restricted";
            // }

            console.log(status);

            const update = await Restaurant(account.metadata!.restaurantId).update({ $set: { "money.card": status } });

            console.log("restaurant capability updated: ", update!.modifiedCount > 0);
        }


        // const status = data.capabilities?.card_payments == "active" && data.capabilities?.transfers == "active";

    } else if (event.type == "payment.succeed") {

    }



    res.send({ received: true });
});
router.post("/account-webhook", e.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;



    console.log(event.type);

    if (event.type == "payment_intent.succeeded") {
        const data = event.data.object as Stripe.PaymentIntent;

        console.log(data);


        if (data.metadata.orderId && data.metadata.restaurantId && (data.metadata.customerId || data.metadata.customerIp)) {

            const { orderId, customerId, customerIp, restaurantId } = data.metadata;

            console.log("on order payed called");

            onOrderPayed(restaurantId, orderId, customerId);

        }

    } else if(event.type == "charge.failed") {
        const data = event.data.object as Stripe.Charge;

        console.log(data);

        if (data.metadata.orderId && data.metadata.restaurantId && data.metadata.customerId) {

            const { orderId, customerId, restaurantId } = data.metadata;

            onOrderPaymentFailed(restaurantId, orderId, customerId);
        } else {
            throw "at charge.failed event no metadata wtf";
        }
    }
    // else if(event.type == "charge.succeeded") {
    //     const data = event.data.object as Stripe.Charge;

    //     console.log(data);


    //     if (data.metadata.orderId && data.metadata.restaurantId && data.metadata.customerId) {

    //         const { orderId, customerId, restaurantId } = data.metadata;

    //         onOrderPayed(restaurantId, orderId, customerId);

    //     }
    // }



    res.send({ received: true });
});

router.get("/", (req, res) => {
    res.send({ hello: true });
});







async function onOrderPayed(restaurantId: string, orderId: string, customerId: string) {

    console.log(restaurantId, orderId, customerId);

    // set order type to progress (cooking)
    const update = await Orders(restaurantId).one({ _id: id(orderId) })
        .update(
            { $set: { status: "progress", ordered: Date.now() } },
            { returnDocument: "after", projection: { dishes: 1, socketId: 1, ordered: 1, } }
        );

    const order = update.order;
    
    sendMessage([order.socketId], "customer", { orderId: order._id, payed: true, type: "payment.succeeded" });


    //     \/  send dishes to kitchen  \/

    const ids = new Set<string>();

    for (let i of order.dishes!) {
        ids.add(i.dishId.toString());
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).get({ projection: { general: 1, } });

    const forKitchen = [];
    const time = getDelay(order.ordered!);
    for (let i in order.dishes!) {
        for (let { general, _id } of dishes) {
            if (_id.equals(order.dishes[i].dishId)) {
                forKitchen.push({
                    orderId: order._id,
                    ...order.dishes![i],
                    time,
                    general: general
                });
            }
        }
    }


    sendMessage([`${restaurantId}/kitchen`], "kitchen", {
        type: "kitchen/order/new",
        event: "kitchen",
        data: forKitchen,
    });


    //     /\  send dishes to kitchen  /\

    // update dishes bought count
    Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).update({ $inc: { bought: 1 } });

    // add order to user history
    if(customerId) {
        updateUser({ _id: id(customerId) }, { $push: { orders: { restaurantId: id(restaurantId), orderId: id(orderId) } } });
    }
}


async function onOrderPaymentFailed(restaurantId: string, orderId: string, customerId: string) {

    const order = await Orders(restaurantId).one({ customer: id(customerId), status: "ordering", _id: id(orderId) }).get({ projection: { socketId: 1 } });

    if(!order.socketId) {

        // send message to stafff !!!!!

        // sendMessage()
        return;
    }

    sendMessage([order.socketId], "customer", { type: "payment.failed", orderId, customerId, restaurantId });

}





export {
    router as StripeRouter
}