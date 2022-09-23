import { Router } from "express";
import { compare, id, makePassword, sendEmail } from "../utils/functions";
import { addUser, byUsername, getUserByEmail, updateUser, user } from "../utils/users";
import { logged } from "../utils/middleware/logged";
import { AddRestaurantRouter } from "./user/addRestaurant";
import { Restaurant as RestaurantType, User } from "../models/general";
import { issueJWT } from "../utils/passport";
import { Locals } from "../models/other";
import { ObjectId } from "mongodb";
import { Restaurant } from "../utils/restaurant";
import { ProfileRouter } from "./user/profile";


const router = Router();

router.use("/add-restaurant", AddRestaurantRouter);
router.use("/profile", ProfileRouter);



/**
 * 
 * @param { string } email    -   valid email
 * @param { string } password -   plain text password
 * 
 * @returns { success: boolean; redirectTo?: string; }
 * 
 * @throws { status: 401 }
 * @throws { status: 404 }
 * @throws { status: 422 }
 * 
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    console.log(req.body);

    const emailFormat = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if(!emailFormat.test(email)) {
        return res.sendStatus(422);
    } else if(typeof password != "string" || password.length < 8) {
        return res.sendStatus(422);
    }


    const user = await getUserByEmail(email, { projection: { password: 1, restaurants: 1 } });

    if(!user) {
        return res.sendStatus(404);
    }

    if(compare(password, user.password)) {

        const data = issueJWT(user._id.toString());

        return res.send({ ...data, success: true, redirectTo: user.restaurants?.length == 0 ? "customer" : null });
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
router.get("/status", logged({ projection: { _id: 1 } }), (req, res) => {
    res.send({ authorized: true });
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

    if(!email || !format.test(email) || typeof email != "string" || !firstName || typeof firstName != "string" || !lastName || typeof lastName != "string" || !password || password.length < 8) {
        return res.sendStatus(422);
    }

    const similar = await getUserByEmail(email, { projection: { email: 1 } });

    if(similar) {
        return res.status(403).send({ reason: "EmailRegistered" });
    }

    const userId = id();
    const code = Math.floor(100000 + Math.random() * 900000);
    const newUser: User = {
        _id: userId,
        status: "restricted",
        email,
        anonymously: false,
        password: makePassword(password)!,
        name: {
            first: firstName,
            last: lastName,
        },
        emailCode: code.toString(),
    };

    const insert = await addUser(newUser);


    if(insert.acknowledged) {
        const message = await sendEmail(email, "Strava Email Confirmation",
            `
            Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
            code: ${code}
            `
        );
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
router.get("/email/check", logged({ projection: { status: 1, email: 1, emailCode: 1, } }), async (req, res) => {
    const { user } = res.locals as Locals;

    if(!user.email) {
        return res.status(401).send({ redirect: true });
    }

    if(!user.emailCode) {
        const code = Math.floor(100000 + Math.random() * 900000);
        const message = await sendEmail(user.email, "Strava Email Confirmation",
            `
            Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
            code: ${code}
            `
        );

        const update = await updateUser(user._id, { $set: { emailCode: code.toString() } }, { projection: { _id: 1, } });
    }

    if(user.status != "restricted") {
        return res.status(403).send({ reason: "AccountConfirmed" });
    }
    

    res.send({ email: user.email });
});




/**
 * 
 * @returns { success: boolean; };
 * 
 * @throws { status: 403; reason: "EmailHasBeenConfirmed" }
 * 
 */
router.post("/email/resend", logged({ projection: { email: 1, } }), async (req, res) => {
    const { user } = res.locals as Locals;

    if(!user.email) {
        return res.status(401).send({ redirect: true });   
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const message = await sendEmail(user.email, "Strava Email Confirmation",
        `
        Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
        code: ${code}
        `
    );

    const update = await updateUser(user._id, { $set: { emailCode: code.toString() } }, { projection: { _id: 1, } });

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
router.post("/email/confirm", logged({ projection: { email: 1, emailCode: 1, status: 1 } }), async (req, res) => {
    const { code } = req.body;
    const { user } = res.locals as Locals;

    if(!code || typeof code != "string" || code.length != 6) {
        return res.status(422).send({ reason: "CodeInvalid" });
    }

    const { email, emailCode, status } = user;

    if(status != "restricted") {
        return res.status(403).send({ reason: "EmailConfirmed" });
    }

    if(!email) {
        return res.status(401).send({ redirect: true });
    } else if(!emailCode) {
        return res.status(403).send({ reason: "CodeNotSet" });
    }

    if(code != emailCode) {
        return res.status(403).send({ reason: "CodeIncorrect" });
    }

    const update = await updateUser(user._id, { $set: { emailCode: null!, status: "enabled" } }, { projection: { _id: 1 } });

    
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
router.post("/email/reset", logged({ projection: { password: 1, email: 1 } }), async (req, res) => {
    const { email, password } = req.body;
    const { user } = res.locals as Locals;

    if(!email || !password) {
        return res.sendStatus(422);
    }
    if(password.length < 8) {
        return res.status(422).send({ reason: "PasswordInvalid" });
    }

    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if(!format.test(email)) {
        return res.status(422).send({ reason: "EmailInvalid" });
    }

    if(user.email == email) {
        return res.status(403).send({ reason: "SameEmails" });
    }

    const same = compare(password, user.password!);

    if(!same) {
        return res.status(403).send({ reason: "PasswordIncorrect" });
    }


    const code = Math.floor(100000 + Math.random() * 900000);
    const message = await sendEmail(email, "Strava Email Confirmation",
        `
        Hello from Strava. To submit your email and create your account please enter the code below to the code field on Strava website
        code: ${code}
        `
    );


    const update = await updateUser(user._id, { $set: { email: email, status: "restricted", emailCode: code.toString() } });


    res.send({ success: update.ok == 1 });
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
router.get("/", logged({ projection: { status: 1, restaurants: 1, name: { first: 1, last: 1, } } }), async (req, res) => {
    const { user } = res.locals as Locals;

    const result: UserInfo = {
        ui: {
            title: `Hi, ${user.name!.first}` || "Strava",
            fullName: `${user.name!.first} ${user.name!.last}`,
            showAddRestaurant: true,
            showEmailVerification: user.status == "restricted",
            showRestaurants: user.restaurants && user.restaurants?.length > 0 || false
        },
        restaurants: [],
    }

    if(user.restaurants) {
        const restaurantsP: Promise<RestaurantType | null>[] = [];
        for(let i of user.restaurants) {
            restaurantsP.push(Restaurant(i.restaurantId).get({ projection: { name: 1, } }));
        }
        const restaurants = await Promise.all(restaurantsP);
        for(let i of user.restaurants) {
            for(let restaurant of restaurants) {
                if(restaurant) {
                    result.restaurants.push({
                        name: restaurant.name!,
                        role: i.role,
                        _id: i.restaurantId,
                        redirectTo: i.role == "staff" ? "" : `restaurant/${i.restaurantId.toString()}`,
                    })
                    break;
                }
            }
        }
    }


    console.log(result);

    res.send(result);

});





/**
 * 
 * NOT FINISHED   REMOVING ACCOUNT HAS TO BE THOUGHT OF
 * 
 * @param {string} password
 * 
 * @returns { success: boolean; }
 * 
 * @throws { status: 422 } - password is invalid
 * @throws { status: 403; reason: "PasswordIncorrect" } - password is incorrect
 * 
 */
router.post("/remove", logged({ projection: { password: 1 } }), async (req, res) => {
    const { password } = req.body;
    const { user } = res.locals as Locals;

    if(!password || password.length < 8) {
        return res.sendStatus(422);
    }

    const same = compare(password, user.password!);

    if(!same) {
        return res.status(403).send({ reason: "PasswordIncorrect" });
    }

});





export {
    router as UserRouter,
}