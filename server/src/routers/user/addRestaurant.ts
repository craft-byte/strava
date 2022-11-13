import { NextFunction, Request, Response, Router } from "express";
import { client, stripe } from "../..";
import { RestaurantSettings } from "../../models/components";
import { id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { getUser, updateUser, user } from "../../utils/users";
import * as axios from "axios";
import { Restaurant as RestaurantType } from "../../models/general";
import { months } from "../../assets/consts";
import { dishesDBName, historyDBName, mainDBName, ordersDBName } from "../../environments/server";
import { logged } from "../../utils/middleware/logged";
import { confirmed } from "../../utils/middleware/confirmed";
import { Locals } from "../../models/other";

const router = Router({ mergeParams: true });

/**
 * checks if user is an owner of a restaurant
 * 
 * @throws { status: 403; reason: "NotOwner" }
 */
async function owner(req: Request, res: Response, next: NextFunction) {
    const { restaurantId } = req.params;

    const { user } = res.locals as Locals;

    if (!user) {
        throw "at addRestaurant.ts can() no user in locals?";
    }

    if (!user.restaurants) {
        return res.status(403).send({ reason: "NotOwner" });
    }

    for (let i of user.restaurants) {
        if (i.restaurantId.equals(restaurantId)) {
            res.locals.stripeAccountId = i.stripeAccountId;
            return next();
        }
    }

    return res.status(403).send({ reason: "NotOwner" });
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



/**
 * 
 * @param {stirng} name - name of restaurant
 * @param {string} country - country code
 * 
 * creates restaurant
 * creates stripe connected account
 * updates user
 * 
 * 
 * @returns { added: boolean; requrements: Hash; insertedId: stirng; }
 */
router.post("/create", logged({ email: 1, status: 1 }), confirmed(true), async (req, res) => {
    const { name, country } = req.body;
    const { user } = res.locals as Locals;

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

    try {
        const account = await stripe.accounts.create({
            type: "custom",
            metadata: {
                userId: user._id.toString(),
                restaurantId: restaurantId.toString(),
            },
            email: user.email,
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
            business_type: "individual"
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
            allowDineIn: true,
            maxCustomers: 10,
            minPrice: 100,
        },
        dishes: {

        },
        payments: {

        },
        staff: {
            mode: "solo"
        }
    }



    const newRestaurant: RestaurantType = {
        _id: restaurantId,
        name,
        owner: user._id,
        staff: [{ userId: user._id, role: "owner", joined: Date.now(), settings: {} }],
        created: new Date(),
        theme: "orange",
        invitations: [],
        settings,
        components: [],
        blacklist: [],
        tables: 1,
        status: "verification",
        info: {
            description: null!,
            time: null!,
            location: {
                country,
                line1: null!,
                line2: null!,
                state: null!,
                city: null!,
                postal_code: null!,
            }
        },
        money: {
            card: "restricted",
            cash: "enabled",
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
            { _id: id(user._id) },
            {
                $push: {
                    restaurants: { restaurantId: newRestaurant._id!, stripeAccountId, role: "owner" },
                },
                $set: {
                    "info.location.country": country,
                }
            }
        );


        result.added = !!result1 && !!result2 && !!result3 && !!result4 && result5.ok == 1;
        result.insertedId = newRestaurant._id;

        console.log("restaurant added: ", result.added);

        return res.send(result)
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }


});


/**
 * sets user's legal name
 */
router.post("/name/:restaurantId", logged({ restaurants: 1, name: 1 }), owner, async (req, res) => {
    const { stripeAccountId, user, } = res.locals as Locals;
    const { firstName, lastName } = req.body;


    try {
        const result = await updateUser({ _id: user._id }, { $set: { name: { first: firstName, last: lastName } } });
        const account = await stripe.accounts.update(stripeAccountId, { individual: { first_name: firstName, last_name: lastName } });


        res.send({ updated: !!account });
    } catch (error) {
        console.log("SETTING NAME");
        throw error;
    }
});


/**
 * sets restaurant location
 */
router.post("/set/state/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { restaurantId } = req.params;
    const { state, country } = req.body;
    const { user } = res.locals as Locals;

    try {
        const result = await getCities(country, state);

        const update = await updateUser({ _id: id(user._id) }, { $set: { "info.location.state": state, "info.location.city": result.data[0].name } });
        const restaurantUpdate = await Restaurant(restaurantId).update({ $set: { "info.location.state": state, "info.location.city": result.data[0].name } });

        console.log("state updated: ", update!.ok == 1);

        res.send(result.data);
    } catch (e) {
        console.error("ERROR GETTING CITIES");
        throw e;
    }

});


/**
 * sets restaurants city
 */
router.post("/set/city/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { restaurantId } = req.params;
    const { city } = req.body;

    const update = await Restaurant(restaurantId).update({ $set: { "info.location.city": city } });

    res.send({ updated: update!.ok == 1 });
});


/**
 * sets full location to restaurant
 * line1, line2, city, state, postal code, country
 * 
 * @throws { status: 422 } - location is invalid
 * @throws { status: 422; reason: "PostalCodeInvalid" } - location is invalid
 */
router.post("/set/all/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId, user } = res.locals as Locals;

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
            "info.location.line1": line1,
            "info.location.line2": line2,
            "info.location.state": state,
            "info.location.city": city,
            "info.location.postal_code": postal_code,
        }
    });
    const userUpdate = await updateUser({ _id: id(user._id) }, {
        $set: {
            "info.location.state": state,
            "info.location.city": city,
            "info.location.postal_code": postal_code,
        }
    });

    console.log("restaurant's location updated: ", restaurantUpdate!.ok == 1);
    console.log("user's location updated: ", userUpdate!.ok == 1);


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


        res.send({ updated: restaurantUpdate!.ok == 1 });

    } catch (e: any) {
        if (e.raw.code == "postal_code_invalid") {
            return res.status(422).send({ reason: "PostalCodeInvalid" });
        }
        console.log("UPDATING ACCOUNT");
        throw e;
    }
});

/**
 * sets user's date of birth
 * 
 * @throws { status: 422 } - date is invalid
 */
router.post("/set/dob/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { stripeAccountId, user } = res.locals;
    const { year, month, day } = req.body;


    if (
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


    await updateUser({ _id: id(user._id) }, {
        $set: {
            "info.dob.year": year,
            "info.dob.month": month,
            "info.dob.day": day,
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



/**
 * 
 * sets bank account for payouts for a restaurant
 * 
 * @throws { status: 422 } - bank account data is invalid
 * @throws { status: 400; reason: "InvalidError"; } - invalid error
 * @throws { status: 500; } - no token invalid error
 * 
 * @returns { updated: boolean; }
 */
router.post("/set/bank-account/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId } = res.locals;
    const { number, branch, institution, name, country, currency } = req.body;

    if (
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

        if (token) {
            await stripe.accounts.createExternalAccount(stripeAccountId, { external_account: token.id });

            const account = await stripe.accounts.retrieve(stripeAccountId);

            let payoutsStatus = "pending";

            if (account.payouts_enabled) {
                payoutsStatus = "enabled";
            }

            await Restaurant(restaurantId).update({ $set: { status: "enabled", "money.payouts": payoutsStatus } });

            res.send({ updated: true });
        } else {
            return res.sendStatus(500);
        }
    } catch (e: any) {
        if (e.raw.type == "invalid_request_error") {
            return res.status(400).send({ reason: "InvalidError" });
        }

        console.log("SETTING BANK ACCOUNT");
        throw e;
    }

});



/**
 * @returns saved location
 */
router.get("/address/:restaurantId", logged({ restaurants: 1 }), owner, async (req, res) => {
    const { restaurantId } = req.params;
    const { stripeAccountId } = res.locals;

    const restaurant = await Restaurant(restaurantId).get({ projection: { info: { location: 1 } } });

    if (!restaurant || !restaurant.info || !restaurant.info.location?.country) {
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
        const states = await getStates(restaurant.info.location.country);
        result.states = states.data;
        if (states.data && states.data.length > 0) {
            const cities = await getCities(restaurant.info.location.country, restaurant.info.location.state || states.data[0].iso2);
            result.cities = cities.data;
        }
    } catch (error: any) {
        console.log("ERROR");
        console.error(error.statusCode);
        throw error;
    }

    result.country = restaurant.info.location.country!;
    result.continue.city = restaurant.info.location.city!;
    result.continue.state = restaurant.info.location.state!;
    result.continue.line1 = restaurant.info.location.line1!;
    result.continue.line2 = restaurant.info.location.line2!;
    result.continue.postal_code = restaurant.info.location.postal_code!;


    res.send(result);
});

/**
 * @returns saved date of birth
 */ 
router.get("/dob", logged({ info: { dob: 1 }, }), async (req, res) => {
    const { user } = res.locals as Locals;

    res.send(user.info?.dob);
});


/**
 * @returns saved full user name
 */
router.get("/name", logged({ name: 1 }), (req, res) => {
    const { user } = res.locals;

    res.send(user.name);
});


/**
 * @returns info for bank account: available currencies, saved user country, holder(user) name
 */
router.get("/bank-account", logged({ name: 1, info: 1 }), async (req, res) => {

    const { user } = res.locals as Locals;

    console.log(user);

    if (!user || !user.info?.location || !user.info?.location.country || !user.name) {
        return res.sendStatus(404);
    }

    const result = await stripe.countrySpecs.retrieve(user.info?.location.country);

    res.send({
        currencies: Object.keys(result.supported_bank_account_currencies),
        country: user.info?.location.country || "AF",
        name: `${user.name.first} ${user.name.last}`,
    });
});

/**
 * @returns currencies
 */
router.get("/currencies/:restaurantId", logged({ info: { location: { country: 1 } } }), async (req, res) => {
    const { user } = res.locals as Locals;
    const { restaurantId } = req.params;

    if (!user || !user.info?.location || !user.info?.location.country) {
        return res.sendStatus(404);
    }

    const result = await stripe.countrySpecs.retrieve(user.info?.location.country);
    const restaurant = await Restaurant(restaurantId).get({ projection: { money: { card: 1, payouts: 1 } } });

    res.send({ currencies: Object.keys(result.supported_bank_account_currencies) });
});

/**
 * @returns currencies
 */
router.get("/currencies/:country", logged({ _id: 1 }), async (req, res) => {
    const { country } = req.params;

    try {
        const result = await stripe.countrySpecs.retrieve(country);

        res.send(Object.keys(result.supported_bank_account_currencies));
    } catch (error: any) {
        console.log("GETTING CURRENCIES BY COUNTRY");
        if (error.raw.type == "invalid_request_error" && error.raw.param == "country") {
            return res.sendStatus(400);
        }
        throw error;
    }
});

/**
 * 
 * @returns { code: string } - code of country
 * 
 * country code can be saved in user object in db
 * else it will be found by ip and saved to user object
 * 
 */
router.get("/country", logged({ info: { location: { country: 1 } } }), async (req, res) => {

    // const user = await getUser(user._id as string, { projection: { info: { country: 1 } } });

    const { user } = res.locals as Locals;

    if (!user) {
        return res.sendStatus(404);
    }

    if (user!.info?.location?.country) {
        return res.send({ code: user!.info?.location.country });
    }

    try {
        const result: any = await axios.default.get("https://api.ipregistry.co/?key=uxv7gs7ywlpf9v7m");


        if (result?.data?.location?.country) {
            const update = await updateUser({ _id: id(user._id) }, { $set: { "info.location.country": result?.data?.location?.country?.code } });

            console.log("user country set: ", update.ok == 1);

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





export {
    router as AddRestaurantRouter
}






// set card is not explored fully yet

// router.post("/set/card/:restaurantId", logged, can({}), async (req, res) => {
    //     const { card, expYear, expMonth, cvc, currency } = req.body;
//     const { stripeAccountId } = res.locals;

//     if (
//         !card ||
//         !currency ||
//         card.length < 16 ||
//         card.length > 19 ||
//         !/^\d+$/.test(card) ||
//         !expYear ||
//         typeof expYear != "number" ||
//         expYear < new Date().getFullYear() ||
//         expYear > new Date().getFullYear() + 5 ||
//         !expMonth ||
//         typeof expMonth != "number" ||
//         !cvc ||
//         typeof cvc != "string" ||
//         cvc.length < 3 ||
//         cvc.length > 4 ||
//         (expYear == new Date().getFullYear() && expMonth < new Date().getMonth())
//     ) {
//         return res.sendStatus(422);
//     }

//     try {
//         const token = await stripe.tokens.create({
//             "card": {
//                 number: card as string,
//                 exp_month: expMonth.toString(),
//                 exp_year: expYear.toString(),
//                 cvc: cvc,
//                 currency: currency.toLowerCase(),
//             }
//         });

//         const account = await stripe.accounts.createExternalAccount(stripeAccountId, { "external_account": token.id });

//         res.send({ updated: !!account });
//     } catch (error: any) {
//         if (error.raw.code == "instant_payouts_unsupported") {
//             return res.status(400).send({ reason: "card" });
//         } else if (error.raw.code == "invalid_card_type") {
//             return res.status(400).send({ reason: "type", message: error.raw.message });
//         };
//         console.log("SETTING CARD");
//         throw error;
//     }
// });