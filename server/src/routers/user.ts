import { Router } from "express";
import { compare, id, makePassword, sendEmail } from "../utils/functions";
import { addUser, updateUser, user as FindUser } from "../utils/users";
import { logged } from "../utils/middleware/logged";
import { AddRestaurantRouter } from "./user/addRestaurant";
import { User } from "../models/general";
import { Restaurant as RestaurantType } from "../models/Restaurant";
import { issueJWT } from "../utils/passport";
import { Locals } from "../models/other";
import { ObjectId, UpdateFilter } from "mongodb";
import { Restaurant } from "../utils/restaurant";
import { ProfileRouter } from "./user/profile";
import * as crypto from "crypto"
import { ResetRouter } from "./user/reset";
import { stripe } from "..";


const router = Router();

router.use("/add-restaurant", AddRestaurantRouter);
router.use("/profile", ProfileRouter);
router.use("/reset", ResetRouter)



/**
 * 
 * @param { string } email    -   valid email
 * @param { string } password -   plain text password
 * 
 * @returns { success: boolean; redirectTo?: string; }
 * 
 * redirectTo - can be restaurant dashboard if user is an owner or a manager in a restaurant
 * 
 * @throws { status: 401 }
 * @throws { status: 404 }
 * @throws { status: 422 }
 * 
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const emailFormat = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if (!emailFormat.test(email)) {
        return res.sendStatus(422);
    } else if (typeof password != "string" || password.length < 8) {
        return res.sendStatus(422);
    }


    const user = await FindUser({ email }, { projection: { password: 1, restaurants: 1 } });

    if (!user) {
        return res.sendStatus(404);
    }

    if (compare(password, user.password!)) {

        let redirectTo: string = null!;

        if (user.restaurants && user.restaurants.length > 0) {
            let restaurant: User["restaurants"][0] = null!;

            for (let i of user.restaurants) {
                if (i.role && i.role == "owner") {
                    restaurant = i;
                    break;
                }
            }
            if (!restaurant) {
                for (let i of user.restaurants) {
                    if (i.role && i.role != "staff") {
                        restaurant = i;
                        break;
                    }
                }
            }
            if (!restaurant) {
                restaurant = user.restaurants[0];
            }

            if (restaurant.role && restaurant.role != "staff") {
                redirectTo = `restaurant/${restaurant.restaurantId.toString()}`;
            }
        }

        const data = issueJWT(user._id.toString());

        return res.send({ ...data, success: true, redirectTo });
    }

    return res.sendStatus(401);
});


/**
 * 
 * used to check if user is authorized
 * 
 * @returns { authorized: boolean; }
 * 
 */
router.get("/update-token", logged({ _id: 1, security: { tokenUpdated: 1, }, restaurants: { restaurantId: 1, role: 1, }, name: 1, email: 1, }), (req, res) => {
    const { user } = res.locals as Locals;

    const result: any = {
        token: null,
        expires: null,
        user: user,
    }

    if (typeof user.security?.tokenUpdated == "number" && user.security?.tokenUpdated < 6) {
        const { expires, token } = issueJWT(user._id.toString());

        result.token = token;
        result.expires = expires;

        updateUser({ _id: user._id }, { $inc: { "security.tokenUpdated": 1 } }, { projection: { _id: 1 } });
    } else if (!user.security?.tokenUpdated || user.security.tokenUpdated >= 6) {
        updateUser({ _id: user._id }, { $set: { "security.tokenUpdated": 0 } }, { projection: { _id: 1 } });
    }

    delete result.user.security;

    console.log(result.expires);

    res.send(result);
});


/**
 * 
 * @returns { user: User }
 * 
 */
router.get("/data", logged({ _id: 1, restaurants: { restaurantId: 1, role: 1, }, name: 1, email: 1, }), (req, res) => {
    const { user } = res.locals;

    res.send({ user });
});


/**
 * creates user in database with email and status "restricted"
 * 
 * @param { email: string; firstName: stirng; lastName: stirng; password: string; }
 * 
 * @throws { status: 422 }
 * @throws { status: 403; reason: "EmailRegistered" } - email has been registered
 * 
 * @returns { success: string; auth: { token: string; expiresAt: number; } }
 * 
 */
router.post("/create", async (req, res) => {
    const { email, firstName, lastName, password } = req.body;

    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if (!email || !format.test(email) || typeof email != "string" || !firstName || typeof firstName != "string" || !lastName || typeof lastName != "string" || !password || password.length < 8) {
        return res.sendStatus(422);
    }

    const similar = await FindUser({ email }, { projection: { email: 1 } });

    if (similar) {
        return res.status(403).send({ reason: "EmailRegistered" });
    }

    const userId = id();
    const code = Math.floor(100000 + Math.random() * 900000);
    const newUser: User = {
        _id: userId,
        status: "restricted",
        email,
        restaurants: [],
        blacklisted: [],
        anonymously: false,
        password: makePassword(password)!,
        online: Date.now(),
        name: {
            first: firstName,
            last: lastName,
        },
        security: {
            code: code.toString(),
            tokenUpdated: 0,
        },
    };

    const insert = await addUser(newUser);


    if (insert.acknowledged) {
        const message = await sendEmail(email, "Strava Email Confirmation",
            `
            Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
            code: ${code}
            `
        );


        sendEmail("bazhantt@gmail.com", "SOMEONE REGISTERED ON STRAVA", `<h1> ${newUser.name?.first} ${newUser.name?.last} </h1> <h2>just registered!!!</h2>`);
    }

    const auth = issueJWT(userId.toString());

    res.send({ success: insert.acknowledged, auth });
});


/**
 * 
 * called when a user wants to confirm email by entering a code
 * allowed.guard.ts
 * 
 * @returns { email: string; }
 * 
 * @throws { status: 403; reason: "AccountConfirmed" }  if email is registered but for some reason confirmation code was not sent
 * 
 */
router.get("/email/check", logged({ status: 1, email: 1, security: { code: 1 } }), async (req, res) => {
    const { user } = res.locals as Locals;

    if (!user.email) {
        return res.status(401).send({ redirect: true });
    }

    if (!user.security!.code) {
        const code = Math.floor(100000 + Math.random() * 900000);
        const message = await sendEmail(user.email, "Strava Email Confirmation",
            `
            Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
            code: ${code}
            `
        );

        const update = await updateUser({ _id: id(user._id) }, { $set: { "security.code": code.toString() } }, { projection: { _id: 1, } });
    }

    if (user.status != "restricted") {
        return res.status(403).send({ reason: "AccountConfirmed" });
    }


    res.send({ email: user.email });
});




/**
 * 
 * @param { boolean } force - force send or not
 * 
 * @returns { success: boolean; };
 * 
 * @throws { status: 422; reason: "InvalidParams" } - invalid type of force or not provided
 * 
 */
router.post("/code/resend", logged({ email: 1, security: { code: 1, } }), async (req, res) => {
    const { user } = res.locals as Locals;
    const { force } = req.body;

    if (typeof force != "boolean") {
        return res.status(422).send({ reason: "InvalidParams" });
    }
    if (!user.email) {
        return res.status(401).send({ redirect: true });
    }

    if (user.security?.code && !force) {
        return res.send({ success: true });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const message = await sendEmail(user.email, "Strava Email Confirmation",
        `
        Hello from Strava. Use this code to confirm an action on Strava platform, please don't share this code with anybody.
        Code: ${code}
        `
    );

    const update = await updateUser({ _id: id(user._id) }, { $set: { "security.code": code.toString(), "security.codeConfrimed": null!, "security.codeToken": null!, "security.codeAsked": Date.now() } }, { projection: { _id: 1, } });

    res.send({ success: update.ok == 1 });
});


/**
 * 
 * @param { code: string; }
 * 
 * @returns { success: boolean; }
 * 
 * 
 * @throws { status: 403; reason: "CodeNotSet" } if code is not set
 * @throws { status: 403; reason: "CodeIncorrect" } if code is not correct
 * 
 * 
 * @throws { status: 422; reason: "CodeInvalid" } if code is invalid (e.x. not 6 chars length)
 * 
 */
router.post("/email/confirm", logged({ email: 1, name: 1, security: { code: 1, }, status: 1 }), async (req, res) => {
    const { code } = req.body;
    const { user } = res.locals as Locals;

    if (!code || typeof code != "string" || code.length != 6) {
        return res.status(422).send({ reason: "CodeInvalid" });
    }

    const { email, security, status, name } = user;

    if (status != "restricted") {
        return res.status(403).send({ reason: "EmailConfirmed" });
    }

    if (!email) {
        return res.status(401).send({ redirect: true });
    } else if (!security?.code) {
        return res.status(403).send({ reason: "CodeNotSet" });
    }

    if (code != security.code) {
        return res.status(403).send({ reason: "CodeIncorrect" });
    }



    const updateFilter: any = {
        $set: {
            status: "enabled",
            "security.code": null!,
            "security.codeConfrimed": Date.now(),
            stripeCustomerId: null!,
        }
    };


    try {
        const customer = await stripe.customers.create({
            email: email,
            name: `${user.name?.first} ${user.name?.last}`,
            metadata: {
                userId: user._id.toString()
            }
        });

        updateFilter.$set!.stripeCustomerId = customer.id;
    } catch (error) {
        console.error(error);
    }



    const update = await updateUser({ _id: id(user._id) }, updateFilter, { projection: { _id: 1 } });




    res.send({ success: update.ok == 1 });
});



/**
 * 
 * @param {string} password
 * @param {string} email
 * 
 * @returns { success: boolean; }
 * 
 * @throws { status: 422 }
 * @throws { status: 422; reason: "PasswordInvalid" }
 * @throws { status: 422; reason: "EmailInvalid" }
 * 
 * @throws { status: 403; reason: "PasswordIncorrect" }
 * @throws { status: 403; reason: "EmailTaken" }
 * @throws { status: 403; reason: "SameEmails" }
 * 
 * 
 */
router.post("/email/reset", logged({ password: 1, email: 1 }), async (req, res) => {
    const { email, password } = req.body;
    const { user } = res.locals as Locals;

    if (!email || !password) {
        return res.sendStatus(422);
    }
    if (password.length < 8) {
        return res.status(422).send({ reason: "PasswordInvalid" });
    }

    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if (!format.test(email)) {
        return res.status(422).send({ reason: "EmailInvalid" });
    }

    if (user.email == email) {
        return res.status(403).send({ reason: "SameEmails" });
    }

    const same = compare(password, user.password!);

    if (!same) {
        return res.status(403).send({ reason: "PasswordIncorrect" });
    }


    const code = Math.floor(100000 + Math.random() * 900000);
    const message = await sendEmail(email, "Strava Email Confirmation",
        `
        Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
        code: ${code}
        `
    );


    const update = await updateUser({ _id: id(user._id) }, { $set: { email: email, status: "restricted", "security.code": code.toString(), "security.codeAsked": Date.now() } });


    res.send({ success: update.ok == 1 });
});


/**
 * 
 * Confirms code sent to email and if true returned user continues to reset the password
 * 
 * @param { string } code - 6 numbers code
 * 
 * @returns { success: boolean; token: string; }
 * 
 */
router.post("/password/confirm-code", logged({ security: { code: 1 }, }), async (req, res) => {
    const { code } = req.body;
    const { user } = res.locals as Locals;

    if (!code || typeof code != "string" || code.length != 6) {
        return res.status(422).send({ reason: "InvalidCode" });
    }

    if (user.security?.code != code) {
        return res.send({ success: false });
    }

    const token = crypto.randomBytes(64).toString('hex');

    const update = await updateUser({ _id: id(user._id) }, { $set: { "security.code": null!, "security.codeToken": token, "security.codeConfirmed": Date.now(), } }, { projection: { _id: 1 } });

    res.send({ success: update.ok == 1, token });

});


/**
 * 
 * Resets user password
 * 
 * @param { string } password - new password
 * @param { string } token - token saved when email code was confirmed /\
 * 
 * @throws { status: 422; reason: "InvalidPassword" } - password is invalid (less than 8 characters)
 * @throws { status: 403; reason: "InvalidToken" } - code token is not provided or invalid
 * @throws { status: 403; reason: "SessionExpired" } - email code was confirmed(user.security.codeConfirmed) 8 minutes ago which is too much
 *  
 * @returns { updated: boolean; }
 * 
 */
router.post("/password/reset", logged({ _id: 1, security: { code: 1, codeToken: 1, codeConfirmed: 1, } }), async (req, res) => {
    const { password, token } = req.body;
    const { user } = res.locals as Locals;

    if (!token) {
        return res.status(403).send({ reason: "InvalidToken" });
    } else if (!password || password.length < 8) {
        return res.status(422).send({ reason: "InvalidPassword" });
    }

    if (user.security?.code) {
        return res.status(403).send({ reason: "InvalidToken" });
    } else if (!user.security?.codeConfirmed || Date.now() - user.security.codeConfirmed > 4800000) {
        return res.status(403).send({ reason: "SessionExpired" });
    } else if (token != user.security?.codeToken) {
        return res.status(403).send({ reason: "InvalidToken" });
    }

    const newPassword = makePassword(password);

    if (!newPassword) {
        return res.status(422).send({ reason: "InvalidPassword" });
    }

    const update = await updateUser({ _id: id(user._id) }, { $set: { password: newPassword, "security.codeConfrimed": null!, "security.codeToken": null!, } }, { projection: { _id: 1 } });

    res.send({ updated: update.ok == 1 });
});


interface UserInfo {
    ui: {
        title: string;
        showRestaurants: boolean;
        showEmailVerification: boolean;
        showAddRestaurant: boolean;
        fullName: string;
    };
    restaurants: {
        _id: ObjectId;
        name: string;
        role: string;
        redirectTo: string;
    }[];
}
/**
 * 
 * used in /user/info
 * user-info.page
 * 
 * 
 * @returns { result: UserInfo }
 * 
 */
router.get("/", logged({ status: 1, restaurants: 1, name: { first: 1, last: 1, } }), async (req, res) => {
    const { user } = res.locals as Locals;

    const result: UserInfo = {
        ui: {
            title: `Hi, ${user.name!.first}` || "Strava",
            fullName: `${user.name!.first} ${user.name!.last}`,
            showAddRestaurant: user.restaurants.length == 0,
            showEmailVerification: user.status == "restricted",
            showRestaurants: user.restaurants && user.restaurants?.length > 0 || false
        },
        restaurants: [],
    }

    if (user.restaurants) {
        const restaurantsP: Promise<RestaurantType | null>[] = [];
        for (let i of user.restaurants) {
            restaurantsP.push(Restaurant(i.restaurantId).get({ projection: { info: { name: 1 }, } }));
        }
        const restaurants = await Promise.all(restaurantsP);
        for (let i of user.restaurants) {
            for (let restaurant of restaurants) {
                if (restaurant && restaurant._id.equals(i.restaurantId)) {
                    result.restaurants.push({
                        name: restaurant.info?.name!,
                        role: i.role,
                        _id: i.restaurantId,
                        redirectTo: i.role == "staff" ? "" : `restaurant/${i.restaurantId.toString()}`,
                    })
                    break;
                }
            }
        }
    }


    res.send(result);

});





/**
 * 
 * NOT USED
 * 
 * @param {string} password
 * 
 * @returns { success: boolean; }
 * 
 * @throws { status: 422 } - password is invalid
 * @throws { status: 403; reason: "PasswordIncorrect" } - password is incorrect
 * 
 */
router.post("/remove", logged({ password: 1 }), async (req, res) => {
    const { password } = req.body;
    const { user } = res.locals as Locals;

    if (!password || password.length < 8) {
        return res.sendStatus(422);
    }

    const same = compare(password, user.password!);

    if (!same) {
        return res.status(403).send({ reason: "PasswordIncorrect" });
    }

});





export {
    router as UserRouter,
}