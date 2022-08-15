import { Router } from "express";
import Stripe from "stripe";
import { stripe } from "..";
import * as e from "express";
import { Restaurant } from "../utils/restaurant";


const router = Router();


// const endpointSecret = "whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24";
// not test     whsec_ca816124e2e863f813d72e18bdb3f90812787a0058768408aefb98021200bd24
router.post("/webhook", e.raw({type: 'application/json'}), async (req, res) => {

    let event: Stripe.Event = req.body;

    // try {
    //     event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    // } catch (err: any) {
    //     console.log(err.message);
    //     res.status(400).send(`Webhook Error: ${err.message}`);
    //     return;
    // }

    console.log(event.type);



    if(event.type == "account.updated") {
        const data = event.data.object as Stripe.Account;


        if(data.requirements?.disabled_reason) {
            // update restaurant

            if(data.requirements?.disabled_reason.split(".")[0] == "rejected") {
                const restaurantUpdate = await Restaurant(data.metadata?.restaurantId as string)
                    .update({ $set: {
                        "status": "disabled",
                        "money.card": "rejected"
                    } });
            }


        }

    } else if(event.type == "capability.updated") {
        const data = event.data.object as Stripe.Capability;

        if(data.id == "transfers" || data.id == "card") {
            let account = data.account as Stripe.Account;
            if(typeof data.account == "string") {
                try {
                    account = await stripe.accounts.retrieve(data.account);
                } catch (error: any) {
                    console.log(error);
                    if(error.raw.code == "account_invalid") {
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
    
            console.log("restaurant capability updated: ", update!.modifiedCount > 0 );
        }


        // const status = data.capabilities?.card_payments == "active" && data.capabilities?.transfers == "active";

    } else if(event.type == "payment.succeed") {
        
    }
    


    res.send({ received: true });
});

router.get("/", (req, res) => {
    res.send({ hello: true });
});

export {
    router as StripeRouter
}