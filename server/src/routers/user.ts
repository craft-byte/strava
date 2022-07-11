import { ObjectId } from "bson";
import { Router } from "express";
import { MODE } from "../index";
import { getDate, id, log, makePassword, sendEmail } from "../utils/functions";
import { Invitation } from "../models/components";
import { addUser, byUsername, getUser, getUserPromise, getUsers, updateUser } from "../utils/users";
import passport from "passport";
import { logged } from "../middleware/user";
import { Restaurant } from "../utils/restaurant";
import { bufferFromString, getRestaurantName, isAddToJobs, isAddToRestaurants } from "../utils/other";
import { UpdateResult } from "mongodb";
import { AddRestaurantRouter } from "./user/addRestaurant";
import { allowed } from "../middleware/restaurant";
import sharp from "sharp";


const router = Router();

router.use("/add-restaurant", AddRestaurantRouter);

router.post("/create", async (req, res) => {
    const { password, username } = req.body;

    const similar = await getUsers({ username }, { projection: { username: 1 } });

    if (similar && similar.length > 0) {
        return res.send({ acknowledged: false, error: "username" });
    }

    const newPassword = makePassword(password);

    if(!newPassword) {
        return res.send({ acknowledged: false, error: "password" });
    }

    const newUser = {
        _id: id()!,
        email: null as unknown as string,
        created: new Date(),
        password: newPassword,
        username: username as string,
        invitations: [] as Invitation[],
        works: [] as ObjectId[],
        restaurants: [] as ObjectId[],
        name: null as unknown as string,
        phone: null as unknown as string,
        sessions: [],
    };

    const result = await addUser(newUser);

    if (result.acknowledged) {
        req.logIn({ username, _id: newUser._id.toString() }, async err => {
            if (err) { return res.status(501).json(err); }
        });
    }

    res.send({ acknowledged: result.acknowledged, user: { username, restaurants: [], works: [], invitations: [], _id: result.insertedId } });
});
router.patch("/login", async (req, res, next) => {

    const { username, password } = req.body;

    if (!username || !password || typeof (username) != "string" || typeof (password) != "string") {
        return res.sendStatus(400);
    }
    passport.authenticate('local', function (err, user, access) {
        if (err) {
            return res.sendStatus(403);
        }


        if(!user) {
            return res.sendStatus(401);
        }

        req.logIn(user, async err => {
            if (err) {
                console.log(err);
                return res.status(501).json(err);
            }

            const user = await byUsername(req.body.username, {
                projection: {
                    works: 1,
                    invitations: 1,
                    restaurants: 1,
                    _id: 1,
                    username: 1,
                    name: 1,
                    phone: 1,
                    avatar: 1,
                    email: 1
                }
            });

            res.send(user);
        });

    })(req, res, next);
});
router.get("/authenticate/:send", async (req, res) => {
    if (!req.isAuthenticated()) {
        console.log("NOT AUTHENTICATED");
        return res.send(false);
    }
    const { send } = req.params;


    if (send == "true") {
        const result = await getUser(req.user as string, {
            projection: {
                works: 1,
                invitations: 1,
                restaurants: 1,
                _id: 1,
                username: 1,
                name: 1,
                phone: 1,
                avatar: 1,
                email: 1
            }
        });
        res.send(result);
    } else {
        res.send(true);
    }
});
router.delete("/logout", logged, async (req, res) => {
    req.logOut();
    res.send({});
});


// router.get("/login", async (req, res) => {
//     if (req.isAuthenticated()) {
//         return res.send(
//             await getUser(req.user as string, {
//                 projection: {
//                     works: 1,
//                     invitations: 1,
//                     restaurants: 1,
//                     _id: 1,
//                     username: 1,
//                     name: 1,
//                     phone: 1,
//                     avatar: 1,
//                     email: 1
//                 }
//             })
//         );
//     } else {
//         return res.send(null);
//     }
// });


router.get("/userInfo", logged, async (req, res) => {
    const user = await getUser(
        req.user as string,
        { projection: {
            username: 1,
            name: 1,
            restaurants: 1,
            works: 1,
            email: 1,
            avatar: { modified: 1 },
        } }
    );

    if(!user) {
        return res.sendStatus(404);
    }

    const getRestaurantNameAndId = async (restaurantId: string | ObjectId, type: "works" | "restaurants") => {
        const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1 } });

        if(!restaurant) {
            const $pull: any = {};
            $pull[type] = id(restaurantId); 
            const result = await updateUser(req.user as string, { $pull });
            console.log("WARNING: users has restaurant that has been removed     ", type, " removed from user: ", result.modifiedCount > 0);
            return null;
        }

        return {
            name: restaurant!.name,
            _id: restaurant!._id
        }
    }


    let showRestaurants = false;
    let showJobs = false;
    let showInvitations = false;
    let registrationParagraphs: any = {};

    if(!user.email) {
        registrationParagraphs.email = "Add email address";
    }
    if(!user.avatar) {
        registrationParagraphs.avatar = "Add avatar image";
    }

    const restaurantsPromise = [];
    const worksPromise = [];

    if(user.restaurants!.length > 0) {
        showRestaurants = true;
        for(let i of user.restaurants!) {
            restaurantsPromise.push(getRestaurantNameAndId(i, "restaurants"));
        }
    }
    if(user.works!.length > 0) {
        showJobs = true;
        for(let i of user.works!) {
            worksPromise.push(getRestaurantNameAndId(i, "works"));
        }
    }
    

    const restaurants = [];
    const works = [];
    
    for(let i of await Promise.all(restaurantsPromise)) {
        if(i) {
            restaurants.push(i);
        }
    }
    for(let i of await Promise.all(worksPromise)) {
        if(i) {
            works.push(i);
        }
    }

    res.send({
        ui: {
            showRestaurants,
            showJobs,
            showAdd: !showRestaurants && !showJobs,
            showInvitations,
            showRegistration: !user.email || !user.avatar,
            title: "Hi " + (user.name || user.username),
            registrationParagraphs,
        },
        restaurants,
        works,
    });
});
router.get("/avatar", logged, async (req, res) => {
    const user = await getUser(req.user as string, { projection: { avatar: 1 } });

    res.send({ avatar: user.avatar?.binary });
});




// router.get("/invitations", logged, async (req, res) => {


//     const user = await getUser(req.user as string, { projeciton: { invitations: 1 } });

//     const { invitations } = user;

//     const result = [];

//     for (let i of invitations!) {
//         result.push({
//             date: getDate(i.date),
//             restaurant: await getRestaurantName(i.restaurantId!),
//             role: i.role,
//             _id: i._id,
//             restaurantId: i.restaurantId,
//         });
//     }

//     res.send(result);
// });

// router.post("/update", logged, async (req, res) => {
//     const { field, value } = req.body;

//     console.log(field, value);

//     const $set: any = {};

//     $set[field] = value;

//     const update = await updateUser(
//         req.user as string,
//         { $set },
//     );

//     console.log(update);

//     res.send(update);
// });

router.post("/username/check", async (req, res) => {
    const { username } = req.body;

    if(!username || username.length < 6) {
        return res.send(false);
    }

    const format = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/;

    if (format.test(username) || username.length < 6) {
        return res.send(false);
    }

    const result = await byUsername(username, { projection: { _id: 1 } });

    res.send(!result);
});
router.get("/email/setup", logged, async (req, res) => {
    const user = await getUser(req.user as string, { projection: { emailVerify: 1, emailVerificationCode: 1 } });

    res.send({...user, emailVerificationCode: !!user.emailVerificationCode });
});
router.post("/email/check", logged, async (req, res) => {
    const { email } = req.body;
    
    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

    if(!format.test(email)) {
        return res.send(false);
    }

    const user = await getUserPromise({ email }, { projection: { _id: 1 } });

    if(email == "test@ctraba.com" && MODE == "testing") {
        return res.send(true);
    }

    res.send(!user);
});
router.post("/email/setEmail", logged, async (req, res) => {
    const { email } = req.body;


    try {
        const inUser = await getUserPromise({ email }, { projection: { _id: 1 } });

        if (inUser) {
            if(MODE != "testing" || email != "test@ctraba.com") {
                return res.send({ acknowledged: false, error: "used" });
            };
        }
    } catch (error) {
        console.error(error);
        throw new Error("error at /email/setEmail");
    }

    const result = await sendEmail(email, "verification", req.user as string); // 1 -- error  2 -- success

    res.send({ acknowledged: result == 2, error: result == 1 ? "wrong" : "none" });
});
router.post("/email/verify", logged, async (req, res) => {
    const { code } = req.body;

    const user = await getUser(req.user as string, { projection: { emailVerify: 1, emailVerificationCode: 1 } });
    if (!user) {
        return res.sendStatus(404);
    }
    if(!user.emailVerify) {
        return res.send({ error: "email" });
    }
    if(!user.emailVerificationCode) {
        return res.send({ error: "code1" });
    }
    if(user.emailVerificationCode != code) {
        if(MODE == "testing" && code == "111111") {
            const update = await updateUser(req.user as string, { $set: { email: user.emailVerify, emailVerify: null, emailVerificationCode: null } });

            return res.send({ error: update.modifiedCount > 0 ? "none" : "update" });
        }
        return res.send({ error: "code2" });
    }

    if(user.emailVerificationCode === code) {
        const update = await updateUser(req.user as string, { $set: { email: user.emailVerify, emailVerify: null, emailVerificationCode: null } });

        return res.send({ error: update.modifiedCount > 0 ? "none" : "update" });
    }
});
router.post("/name/set", logged, async (req, res) => {
    const { name } = req.body;

    if(!name || name.length < 6 || name.length > 30) {
        return res.sendStatus(422);
    }

    const update = await updateUser(req.user as string, { $set: { name } });

    res.send({ success: update.modifiedCount > 0 });
});
router.post("/avatar", logged, async (req, res) => {
    const { avatar } = req.body;

    const buffer = bufferFromString(avatar);


    try {
        const result = await sharp(buffer).resize(1000).png({ quality: 50 }).toBuffer();
        const update = await updateUser(req.user as string, { $set: { avatar: {
            binary: result,
            modified: new Date(),
        } } })
    
        res.send({
            updated: update.modifiedCount > 0
        });
    } catch (e) {
        console.log(e);
        return res.sendStatus(500);
    }


});


router.get("/restaurant/expanded/:restaurantId", logged, allowed("manager"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).get({ projection: { _id: 1 } });

    res.send("Not implemented")
});


router.patch("/invitations/reject/:restaurantId/:userId/:inv", logged, async (req, res) => {
    const { userId, inv, restaurantId } = req.params;

    const userUpdate = await updateUser(userId, { $pull: { invitations: { _id: id(inv) } } });
    const restaurantUpdate = await Restaurant(restaurantId).update({ $pull: { invitations: { _id: id(inv) } } });

    res.send({ success: userUpdate.modifiedCount > 0 && restaurantUpdate!.modifiedCount > 0 });
});
router.patch("/invitation/accept/:user/:inv", logged, async (req, res) => {
    const { user, inv } = req.params;

    const foundUser = await getUser(user, { projection: { invitations: 1 } });

    if (!foundUser || !foundUser.invitations) {
        log("failed invitation accepting", "no user found");
        return res.sendStatus(404);
    } else if (foundUser.invitations.length == 0) {
        log("failed invitation accepting", "no invitations found");
        return res.sendStatus(404);
    }

    let userI: Invitation = null!;



    for (let i of foundUser.invitations) {
        if (i._id.toString() == inv) {
            userI = i;
        }
    }

    if (!userI) {
        log("FAILED", "USER INVITATION DOESNT EXIST");
        return res.sendStatus(404);
    }


    const foundR = await Restaurant(userI!.restaurantId).get({ projection: { invitations: 1 } });


    if (!foundR || !foundR.invitations || foundR.invitations.length == 0) {
        log("failed", `invitation doesnt exists in restaurant [${userI!.restaurantId}] [${inv}]`);

        await updateUser(user, {
            $pull: { invitations: { _id: id(inv) } }
        });

        return res.send({ success: true });
    }

    let restaurantI: Invitation = null!;

    for (let i of foundR.invitations) {
        if (i._id.toString() == inv) {
            restaurantI = i;
        }
    }

    if (!restaurantI) {
        log("failed", `invitation doesnt exists in restaurant [${foundR._id.toString()}]`);
        return res.sendStatus(404);
    }

    const restaurant = foundR._id;

    const updatedRestaurant = await Restaurant(restaurant).update({
        $push: {
            staff: {
                _id: id(user)!,
                joined: new Date(),
                role: restaurantI!.role!,
                settings: restaurantI!.settings,
            },
        },
        $pull: {

            invitations: { _id: id(inv) }
        }
    });

    let userUpdate: UpdateResult = null!;
    let addJob = false;
    let addRestaurant = false;

    if (restaurantI.role == "cook" || restaurantI.role == "waiter") {
        addJob = true;
        userUpdate = await updateUser(user, {
            $push: { works: restaurant },
            $pull: { invitations: { _id: id(inv) } },
        });
    }


    else {
        const $push: any = {};

        addJob = isAddToJobs(restaurantI.settings!);
        addRestaurant = isAddToRestaurants(restaurantI.settings!);


        if (addJob) {
            $push.works = restaurant;
        }
        if (addRestaurant) {
            $push.restaurants = restaurant;
        }

        userUpdate = await updateUser(user, {
            $push,
            $pull: { invitations: { _id: id(inv) } }
        });
    }

    const result = updatedRestaurant?.modifiedCount! > 0 && userUpdate.modifiedCount > 0;

    const restaurantName = await getRestaurantName(restaurant);

    res.send({
        success: result,
        job: addJob ? { name: restaurantName, _id: restaurant } : null,
        restaurant: addRestaurant ? { name: restaurantName, _id: restaurant } : null
    });
});


export {
    router as UserRouter,
}