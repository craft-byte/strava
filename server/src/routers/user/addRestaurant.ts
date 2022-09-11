import { NextFunction, Request, Response, Router } from "express";
import { client, stripe } from "../..";
import { email, logged } from "../../middleware/user";
import { RestaurantSettings } from "../../models/components";
import { id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { getUser, updateUser } from "../../utils/users";
import * as axios from "axios";
import { Restaurant as RestaurantType } from "../../models/general";
import { months } from "../../assets/consts";
import { dishesDBName, historyDBName, mainDBName, ordersDBName } from "../../environments/server";

const router = Router({ mergeParams: true });


function can(projection: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { restaurantId } = req.params;
        const user = await getUser(req.user as string, { projection: { ...projection, restaurants: 1 } });

        res.locals.user = user;

        console.log("HELLO CAN");

        if (!user!.restaurants) {
            return res.status(404).send({ reason: "wrong" });
        }

        for (let i of user!.restaurants) {
            if (i.restaurantId.equals(restaurantId)) {
                res.locals.stripeAccountId = i.stripeAccountId;
                return next();
            }
        }

        return res.status(403).send({ reason: "forbidden" });
    }
};
async function getStates(country: string) {
    try {
        return await axios.default.get(`https://api.countrystatecity.in/v1/countries/${country}/states`, {
            headers: {
                "X-CSCAPI-KEY": "RDIzRFJMR2w4UkxrRHBxYXI2Y2xWekNzVnE0REVVZGpPV2IzWWl3Mg=="
            }
        })
    } catch (e) {
        console.log("GET STATES ERROR");
        console.log(e);
        throw e;
    }
}
async function getCities(country: string, state: string) {
    try {
        return await axios.default.get(`https://api.countrystatecity.in/v1/countries/${country}/states/${state}/cities`, {
            headers: {
                "X-CSCAPI-KEY": "RDIzRFJMR2w4UkxrRHBxYXI2Y2xWekNzVnE0REVVZGpPV2IzWWl3Mg=="
            }
        });
    } catch (e) {
        console.log(e);
        throw e;
    }
}
async function checkLocation(country: string, state: string, city: string) {
    try {
        const result = await axios.default.get(`https://api.countrystatecity.in/v1/countries/${country}/states/${state}/cities`, { headers: { "X-CSCAPI-KEY": "RDIzRFJMR2w4UkxrRHBxYXI2Y2xWekNzVnE0REVVZGpPV2IzWWl3Mg==" } })


        if (!result || !result.data || result.data.length == 0) {
            return false;
        }

        for (let i of result.data) {
            if (i.name == city) {
                return true;
            }
        }


        return false;


    } catch (e) {
        console.error("ERROR CHECKING LOCATION");
        throw e;
    }
}


router.post("/create", logged, email, async (req, res) => {
    const { name, country } = req.body;

    if (!name || name.length < 4 || !country || country.length < 2) {
        return res.sendStatus(422);
    }


    const restaurantId = id()!;

    const result = {
        added: false,
        requirements: {} as any,
        insertedId: null as any,
    }

    let stripeAccountId: string;

    const user = await getUser(req.user as string, { projection: { email: 1, username: 1 } });

    try {
        const account = await stripe.accounts.create({
            type: "custom",
            metadata: {
                userId: user!._id!.toString(),
                restaurantId: restaurantId.toString(),
            },
            email: user!.email,
            capabilities: {
                card_payments: {
                    requested: true,
                },
                transfers: {
                    requested: true,
                }
            },
            country,
            tos_acceptance: {
                ip: req.ip,
                date: Math.floor(Date.now() / 1000),
            },
            "business_type": "individual"
        });



        stripeAccountId = account.id;

        const cardCapability = await stripe.accounts.retrieveCapability(account.id, "card_payments");



        if (cardCapability.requirements) {
            for (let i of cardCapability.requirements.currently_due) {
                switch (i) {
                    case "representative.address.city":
                        result.requirements[i] = "Owner's city";
                        break;
                    case "representative.address.line1":
                        result.requirements[i] = "Owner's address";
                        break;
                    case "representative.address.postal_code":
                        result.requirements[i] = "Owner's postal code";
                        break;
                    case "representative.address.state":
                        result.requirements[i] = "Owner's state";
                        break;
                    case "representative.dob.day":
                        result.requirements[i] = "Owner's date of birth";
                        break;
                    case "representative.first_name":
                        result.requirements[i] = "Owner's first name";
                        break;
                    case "representative.last_name":
                        result.requirements[i] = "Owner's last name";
                        break;
                }
            }
        } else {
            console.log("no card capability requirements");
        }

    } catch (error: any) {
        console.error("STRIPE ACCOUNT ERROR");
        console.error(error);
        if (error.raw.code == "country_unsupported") {
            return res.status(400).send({ reason: "country" });
        }
        return res.sendStatus(500);
    }







    const settings: RestaurantSettings = {
        work: {
            maxOrdersCooking: 10,
        },
        customers: {
            maxDishes: 10,
            allowTakeAway: true,
            trust: 1,
            maxCustomers: 10,
            maxPrice: "unlimited",
            minPrice: 100,
        },
        dishes: {
            strictIngredients: false,
            types: 1,
        },
        payments: {

        },
    }



    const newRestaurant: RestaurantType = {
        _id: restaurantId,
        name,
        owner: id(req.user as string)!,
        staff: [{ userId: id(req.user as string)!, role: "admin", joined: Date.now(), settings: {} }],
        created: new Date(),
        theme: "orange",
        invitations: [],
        settings,
        components: [],
        blacklist: [],
        tables: 1,
        status: "verification",
        info: {
            country,
            line1: null!,
            line2: null!,
            state: null!,
            city: null!,
            postal_code: null!,
        },
        money: {
            card: "restricted",
            cash: "disabled",
            payouts: "restricted",
        },
        stripeAccountId,
    };

    try {
        const result1 = await client.db(mainDBName).collection("restaurants")
            .insertOne(newRestaurant);
        const result2 = await client.db(dishesDBName).createCollection(newRestaurant._id.toString());
        const result3 = await client.db(ordersDBName).createCollection(newRestaurant._id.toString());
        const result4 = await client.db(historyDBName).createCollection(newRestaurant._id.toString());
        const result5 = await updateUser(
            req.user as string,
            {
                $push: {
                    restaurants: { restaurantId: newRestaurant._id!, stripeAccountId, role: "owner" },
                },
                $set: {
                    "info.country": country,
                }
            }
        );


        result.added = !!result1 && !!result2 && !!result3 && !!result4 && result5.modifiedCount > 0;
        result.insertedId = newRestaurant._id;

        console.log("restaurant added: ", result.added);

        return res.send(result)
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }


});

router.post("/name/:restaurantId", logged, can({}), async (req, res) => {
    const { stripeAccountId } = res.locals;
    const { firstName, lastName } = req.body;


    try {
        const result = await updateUser(req.user as string, { $set: { fullName: { firstName, lastName } } });
        const account = await stripe.accounts.update(stripeAccountId, { individual: { first_name: firstName, last_name: lastName } });


        res.send({ updated: !!account });
    } catch (error) {
        console.log("SETTING NAME");
        throw error;
    }
});
router.post("/set/state/:restaurantId", logged, can({}), async (req, res) => {
    const { restaurantId } = req.params;
    const { state, country } = req.body;

    try {
        const result = await getCities(country, state);

        const update = await updateUser(req.user as string, { $set: { "info.state": state, "info.city": result.data[0].name } });
        // const update = await Restaurant(restaurantId).update({ $set: { "info.state": state, "info.city": result.data[0].name } });

        console.log("state updated: ", update!.modifiedCount > 0);

        res.send(result.data);
    } catch (e) {
        console.error("ERROR GETTING CITIES");
        throw e;
    }

});
router.post("/set/city/:restaurantId", logged, can({}), async (req, res) => {
    const { restaurantId } = req.params;
    const { city } = req.body;

    const update = await Restaurant(restaurantId).update({ $set: { "info.city": city } });


    res.send({ updated: update!.modifiedCount > 0 });
});
router.post("/set/all/:restaurantId", logged, can({}), async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId } = res.locals;

    const { line1, line2, city, state, postal_code, country } = <{ [key: string]: string; }>req.body;

    if (
        !line1 || line1.length < 4 ||
            line2 ? line2.length < 4 : false ||
            !city || !state || !postal_code ||
            postal_code.length != 6 || !(await checkLocation(country, state, city))
    ) {
        return res.sendStatus(422);
    }


    const restaurantUpdate = await Restaurant(restaurantId).update({
        $set: {
            "info.line1": line1,
            "info.line2": line2,
            "info.state": state,
            "info.city": city,
            "info.postal_code": postal_code,
        }
    });
    const userUpdate = await updateUser(req.user as string, {
        $set: {
            "info.state": state,
            "info.city": city,
            "info.postal_code": postal_code,
        }
    });

    console.log("restaurant's location updated: ", restaurantUpdate!.modifiedCount > 0);
    console.log("user's location updated: ", userUpdate!.modifiedCount > 0);


    try {
        const accountUpdate = await stripe.accounts.update(stripeAccountId, {
            "individual": {
                "address": {
                    "city": city,
                    "state": state,
                    "line1": line1,
                    "line2": line2,
                    "postal_code": postal_code,
                }
            }
        });


        res.send({ updated: restaurantUpdate!.modifiedCount > 0 });

    } catch (e: any) {
        if(e.raw.code == "postal_code_invalid") {
            return res.status(400).send({ reason: "postal_code" });
        }
        console.log("UPDATING ACCOUNT");
        throw e;
    }
});
router.post("/set/dob/:restaurantId", logged, can({}), async (req, res) => {
    const { stripeAccountId } = res.locals; 
    const { year, month, day } = req.body;

    console.log(req.body);

    if(
        !year ||
        typeof year != "number" ||
        year < 1900 ||
        year > new Date().getFullYear() ||
        !month ||
        typeof month != "number" ||
        month < 1 ||
        month > 12 ||
        !day ||
        typeof day != "number" ||
        day < 1 ||
        day > 31 ||
        (day == 31 && !["Jan", "Mar", "May", "Jul", "Aug", "Oct", "Dec"].includes(months[month - 1])) ||
        (months[month - 1] == "Feb" && day > 28) ||
        (year == new Date().getFullYear() && month - 1 > new Date().getMonth()) ||
        (year == new Date().getFullYear() && month - 1 == new Date().getMonth() && day > new Date().getDate())
    ) {
        return res.sendStatus(422);
    }

    console.log("HELLO");


    await updateUser(req.user as string, {
        $set: {
            "info.year": year,
            "info.month": month,
            "info.day": day,
        }
    });

    try {
        await stripe.accounts.update(
            stripeAccountId,
            { "individual": { "dob": { year, month: month, day } } }
        );

        res.send({ updated: true });
    } catch (e) {
        console.log("UPDATIN DATE");
        throw e;
    }


});
router.post("/set/card/:restaurantId", logged, can({}), async (req, res) => {
    const { card, expYear, expMonth, cvc, currency } = req.body;
    const { stripeAccountId } = res.locals;

    if(
        !card ||
        !currency ||
        card.length < 16 ||
        card.length > 19 ||
        !/^\d+$/.test(card) ||
        !expYear ||
        typeof expYear != "number" ||
        expYear < new Date().getFullYear() ||
        expYear > new Date().getFullYear() + 5 ||
        !expMonth ||
        typeof expMonth != "number" ||
        !cvc ||
        typeof cvc != "string" ||
        cvc.length < 3 ||
        cvc.length > 4 ||
        (expYear == new Date().getFullYear() && expMonth < new Date().getMonth())
    ) {
        return res.sendStatus(422);
    }

    try {
        const token = await stripe.tokens.create({
            "card": {
                number: card as string,
                exp_month: expMonth.toString(),
                exp_year: expYear.toString(),
                cvc: cvc,
                currency: currency.toLowerCase(),
            }
        });
        
        const account = await stripe.accounts.createExternalAccount(stripeAccountId, { "external_account": token.id });
        
        res.send({ updated: !!account });
    } catch (error: any) {
        if(error.raw.code == "instant_payouts_unsupported") {
            return res.status(400).send({ reason: "card" });
        } else if(error.raw.code == "invalid_card_type") {
            return res.status(400).send({ reason: "type", message: error.raw.message });
        };
        console.log("SETTING CARD");
        throw error;
    }
});
router.post("/set/bank-account/:restaurantId", logged, can({}), async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId } = res.locals;
    const { number, branch, institution, name, country, currency } = req.body;

    if(
        !number ||
        number.toString().length < 5 ||
        number.toString().length > 17 ||
        !branch ||
        !institution ||
        !name ||
        !country ||
        !currency
    ) {
        return res.sendStatus(422);
    }

    try {
        const token = await stripe.tokens.create({
            bank_account: {
                account_number: number.toString(),
                routing_number: `${branch}-${institution}`,
                account_holder_name: name,
                currency,
                country,
            }
        });

        if(token) {
            await stripe.accounts.createExternalAccount(stripeAccountId, { external_account: token.id });

            const account = await stripe.accounts.retrieve(stripeAccountId);

            let payoutsStatus = "pending";

            if(account.payouts_enabled) {
                payoutsStatus = "enabled";
            }

            await Restaurant(restaurantId).update({ $set: { status: "enabled", "money.payouts": payoutsStatus } });

            res.send({ updated: true });
        } else {
            return res.sendStatus(500);
        }
    } catch (e: any) {
        if(e.raw.type == "invalid_request_error") {
            return res.status(400).send({ reason: "no" });
        }

        console.log("SETTING BANK ACCOUNT");
        throw e;
    }
    
});


// router.post("/theme/:restaurantId", logged, async (req, res) => {
//     const { restaurantId } = req.params;
//     const { color } = req.body;

//     if (!restaurantId || restaurantId.length != 24) {
//         return res.sendStatus(422);
//     }

//     if (!color || ![
//         "red", "green", "orange", "brown", "black", "white", "gray", "sea", "blue", "pink", "purple",
//     ].includes(color)) {
//         return res.sendStatus(422);
//     }

//     const result = await Restaurant(restaurantId).update({ $set: { theme: color } });


//     res.send({ success: result!.modifiedCount > 0 || result!.matchedCount > 0 });
// });




// router.get("/name/:restaurantId", logged, async (req, res) => {
//     const { restaurantId } = req.params;

//     if (!restaurantId || restaurantId.length != 24) {
//         return res.sendStatus(422);
//     }

//     const result = await Restaurant(restaurantId).get({ projection: { name: 1, theme: 1 } });

//     res.send({ name: result ? result.name : null });
// });



router.get("/address/:restaurantId", logged, can({ restaurants: 1 }), async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId } = res.locals;

    const restaurant = await Restaurant(restaurantId).get({ projection: { info: 1 } });

    if (!restaurant || !restaurant.info || !restaurant.info.country) {
        return res.sendStatus(403);
    }

    const result: {
        continue: {
            line1: string;
            line2: string;
            city: string;
            postal_code: string;
            state: string;
        };
        states: any[];
        cities: any[];
        country: string;
    } = {
        continue: {
            line1: null!,
            city: null!,
            line2: null!,
            postal_code: null!,
            state: null!,
        },
        states: null!,
        cities: null!,
        country: null!,
    }


    try {
        const states = await getStates(restaurant.info.country);
        result.states = states.data;
        if (states.data && states.data.length > 0) {
            const cities = await getCities(restaurant.info.country, restaurant.info.state || states.data[0].iso2);
            result.cities = cities.data;
        }
    } catch (error: any) {
        console.log("ERROR");
        console.error(error.statusCode);
        throw error;
    }

    result.country = restaurant.info.country!;
    result.continue.city = restaurant.info.city!;
    result.continue.state = restaurant.info.state!;
    result.continue.line1 = restaurant.info.line1!;
    result.continue.line2 = restaurant.info.line2!;
    result.continue.postal_code = restaurant.info.line2!;


    res.send(result);
});
router.get("/dob", logged, async (req, res) => {
    
    const user = await getUser(req.user as string, { projection: { info: { year: 1, month: 1, day: 1 } } });

    if(!user) {
        return res.sendStatus(404);
    }

    res.send(user?.info);
});
router.get("/bank-account", logged, async (req, res) => {
    const user = await getUser(req.user as string, { projection: { fullName: 1, info: { country: 1 } } });

    if(!user || !user.info || !user.info.country || !user.fullName) {
        return res.sendStatus(404);
    }

    const result = await stripe.countrySpecs.retrieve(user.info.country);

    res.send({
        currencies: Object.keys(result.supported_bank_account_currencies),
        country: user.info.country || "AF",
        name: `${user.fullName.firstName} ${user.fullName.lastName}`,
    });
});
router.get("/currencies", logged, async (req, res) => {
    const user = await getUser(req.user as string, { projection: { info: { country: 1 } } });

    if(!user || !user.info || !user.info.country) {
        return res.sendStatus(404);
    }

    const result = await stripe.countrySpecs.retrieve(user.info.country);

    res.send(Object.keys(result.supported_bank_account_currencies));
});
router.get("/currencies/:country", logged, async (req, res) => {
    const { country } = req.params;

    try {
        const result = await stripe.countrySpecs.retrieve(country);
    
        res.send(Object.keys(result.supported_bank_account_currencies));
    } catch (error: any) {
        console.log("GETTING CURRENCIES BY COUNTRY");
        if(error.raw.type == "invalid_request_error" && error.raw.param == "country") {
            return res.sendStatus(400);
        }
        throw error;   
    }
});
router.get("/country", logged, async (req, res) => {

    const user = await getUser(req.user as string, { projection: { info: { country: 1 } } });

    if(!user) {
        return res.sendStatus(404);
    }

    if (user!.info?.country) {
        return res.send({ code: user!.info.country });
    }

    try {
        const result: any = await axios.default.get("https://api.ipregistry.co/?key=uxv7gs7ywlpf9v7m");


        if(result?.data?.location?.country) {
            const update = await updateUser(req.user as string, { $set: { "info.country": result?.data?.location?.country?.code } });
    
            console.log("user country set: ", update.modifiedCount > 0);
    
            res.send({ code: result?.data?.location?.country?.code });
        } else {
            return res.send({ code: "AF" });
        }
        
    } catch (error) {
        console.error(error);
        console.log("GETTING COUNTRY");
        res.sendStatus(500);
    }

});



// router.delete("/stop/:restaurantId", logged, can({ restaurants: 1 }), async (req, res) => {
//     const { restaurantId } = req.params;

//     const { stripeAccountId } = res.locals;

//     if (!stripeAccountId) {
//         return res.status(404).send({ reason: "restaurant" });
//     }


//     const account = await stripe.accounts.del(stripeAccountId);


//     const restaurant = await Restaurant(restaurantId).remove();


//     console.log("restaurant removed: ", account.deleted && restaurant);

//     res.send({ removed: account.deleted && restaurant });
// });



export {
    router as AddRestaurantRouter
}