import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "..";
import * as e from "express";
import { Orders, Restaurant } from "../utils/restaurant";
import { id } from "../utils/functions";
import { sendMessage } from "../utils/io";
import { getDelay } from "../utils/other";
import { updateUser } from "../utils/users";
import { Order } from "../models/general";
import { StripeOrderMetadata } from "../models/other";


const router = Router();


// const endpointSecret = "whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24";
// not test     whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24
router.post("/webhook", e.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;

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
                            "settings.money.card": "rejected"
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


            const update = await Restaurant(account.metadata!.restaurantId).update({ $set: { "settings.money.card": status } }, { projection: { status: 1 } });

            if(status == "enabled" && update.restaurant.status == "verification") {
                const update2 = await Restaurant(update.restaurant._id).update({ $set: { status: "enabled" } });
            }

            console.log("restaurant capability updated: ", update!.ok == 0);
        }

    }



    res.send({ received: true });
});
router.post("/account-webhook", e.raw({ type: 'application/json' }), async (req, res) => {

    let event: Stripe.Event = req.body;



    console.log(event.type);

    if (event.type == "payment_intent.succeeded") {
        const data = event.data.object as Stripe.PaymentIntent;

        console.log(data);


        if (data.metadata.orderId && data.metadata.restaurantId) {

            const { orderId, restaurantId, by } = data.metadata as StripeOrderMetadata;

            console.log("on order payed called");
            
            onOrderPayed(restaurantId, orderId, by);
            
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


    res.send({ received: true });
});

router.get("/", (req, res) => {
    res.send({ hello: true });
});







async function onOrderPayed(restaurantId: string, orderId: string, by: "customer" | "staff") {

    console.log(restaurantId, orderId, by);

    // set order type to progress (cooking)
    const update = await Orders(restaurantId).one({ _id: id(orderId) })
        .update(
            { $set: { status: "progress", method: "card", ordered: Date.now() } },
            { returnDocument: "after", projection: { dishes: 1, onBefalf: 1, socketId: 1, ordered: 1, customer: 1, } }
        );

    const order = update.order;

    if(by && order.socketId) {
        sendMessage([order.socketId], "customer", { orderId: order._id, payed: true, type: "payment.succeeded" });
    }


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
    Restaurant(restaurantId).dishes.many({ _id: { $in: Array.from(ids).map(a => id(a)) } }).update({ $inc: { "info.bought": 1 } });


    
    // add order to user history
    if(by == "customer" && order.customer) {
        updateUser({ _id: id(order.customer) }, { $push: { orders: { restaurantId: id(restaurantId), orderId: id(orderId) } } });
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