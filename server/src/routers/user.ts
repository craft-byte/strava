import { ObjectId } from "bson";
import { Router } from "express";
import { db } from "./../environments/server";
import { client } from "../index";
import { compare, getDate, id, log, makePassword, sendEmail } from "../utils/functions";
import { SessionData } from "express-session";
import { Invitation, ManagerSettings, RestaurantSettings } from "../models/components";
import { addUser, byUsername, getUser, getUserPromise, getUsers, updateUser } from "../utils/users";
import passport from "passport";
import { logged } from "../middleware/user";
import { Restaurant } from "../utils/restaurant";
import { getRestaurantName, isAddToJobs, isAddToRestaurants } from "../utils/other";
import { UpdateResult } from "mongodb";


const router = Router();



let session: SessionData;

router.post("/create", async (req, res) => {
    const { password, username } = req.body;

    const newPassword = makePassword(password);

    const similar = await getUsers({ username }, { projection: { username: 1 } });

    if (similar && similar.length > 0) {
        res.send({ error: "username" });
        return;
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
    };

    const result = await addUser(newUser);

    if (result.acknowledged) {
        log('success', "user created");
        req.logIn({ username, _id: newUser._id.toString() }, async err => {
            if (err) { return res.status(501).json(err); }
        });
    } else {
        log('failed', "creating user");
    }

    res.send({ acknowledged: result.acknowledged, user: { username, restaurants: [], works: [], invitations: [], _id: result.insertedId } });
});
router.patch("/login", async (req, res, next) => {
    passport.authenticate('local', function(err, user, info) {


        if (err) {
            console.error(err);
            throw new Error("at passport.authenticate");
        }

        if (info) {
            const { error } = info;
            log("failed login", error, "is wrong");
            if(error == "username") {
                return res.send({ error: "username" });
            } else {
                return res.send({ error: "password" });
            }
        }

        req.logIn(user, async err => {
          if (err) { return res.status(501).json(err); }

          console.log("LOGGED");

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
    if(!req.isAuthenticated()) {
        return res.send(false);
    }
    const { send } = req.params;



    if(send == "true") {
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
router.delete("/logout", async (req, res) => {
    req.logOut();
    res.send({});
});
router.post("/email/setEmail", logged, async (req, res) => {
    const { email } = req.body;

    try {
        const inUser = await getUserPromise({ email }, { projection: { _id: 1 } });

        if(inUser) {
            return res.send({ error: "used" });
        }
        
    } catch (error) {
        console.error(error);
        throw new Error("error at /email/setEmail");
    }

    const result = await sendEmail(email, "verification", req.user as string);

    res.send(result);
});
router.post("/email/verify", logged, async (req, res) => {
    const { code } = req.body;

    const user = await getUser(req.user as string, { projection: { emailVerify: 1, emailVerificationCode: 1 } });
    if(!user) {
        return res.sendStatus(404).send({ error: "user" });
    }
    if(!user.emailVerificationCode || !user.emailVerify) {
        return res.send({ error: "code" });
    }


    if(code == user.emailVerificationCode) {
        const result = await updateUser(req.user as string, { $set: { email: user.emailVerify, emailVerificationCode: null, emailVerify: null } });

        if(result.modifiedCount > 0) {
            return res.send({ error: "none" });
        } else {
            return res.send({ error: "unknown" });
        }
    } else {
        return res.send({ error: "code" });
    }
});
router.get("/login", async (req, res) => {
    if(req.isAuthenticated()) {
        return res.send(
            await getUser(req.user as string, { projection: {
                works: 1,
                invitations: 1,
                restaurants: 1,
                _id: 1,
                username: 1,
                name: 1,
                phone: 1,
                avatar: 1,
                email: 1
            }})
        );
    } else {
        return res.send(null);
    }
});

router.post("/addRestaurant", logged, async (req, res) => {
    const { restaurant } = req.body;

    log("info", "adding restaurant ", restaurant.name);

    const settings: RestaurantSettings = {
        work: {
            
        },
        customers: {
            maxDishes: 10,
            orders: true,
            trust: 1
        },
        dishes: {
            strictIngredients: false,
            types: 1,
        },
        payments: {
            
        }
    }

    const forRestaurant = {
        ...restaurant,
        _id: id()!,
        owner: new ObjectId(req.user as string),
        staff: [{ _id: new ObjectId(req.user as string), role: "admin", joined: new Date(), prefers: [], settings: {} }],
        created: new Date(),
        tables: [],
        invitations: [],
        settings,
        components: [],
        tutorials: {
            dishes: true,
            staff: true,
            cooking: true,
        }
    };



    const insertedRestaurant = await client.db(db).collection("restaurants")
        .insertOne(forRestaurant);
    client.db(db).createCollection(forRestaurant._id.toString());


    const work = { 
        restaurant: forRestaurant._id, 
        orders: [], 
        waiter: [] 
    };
    client.db(db).collection("work").insertOne(work);





    const result2 = await updateUser(
        req.user as string,
        {
            $push: {
                restaurants: forRestaurant._id,
                works: forRestaurant._id
            }
        }
    );

    if (result2.acknowledged && insertedRestaurant.acknowledged) {
        res.send({ error: "none", insertedId: forRestaurant._id });
        log("success", "adding restaurant ", restaurant.name);
        return;
    }

    log("failed", "adding restaurant ", restaurant.name);

    res.send({ error: "wrong" });
});
router.get("/restaurants", logged, async (req, res) => {
    

    const user = await getUser(
        req.user as string,
        { projection: {
            restaurants: 1
        } }
    );

    if(!user) {
        return res.send({ error: "user" });
    }

    const { restaurants: ids } = user;

    const restaurants = await Restaurant().search(
        { _id: { $in: ids } },
        { projection: { name: 1 } }
    );


    const result = [];

    for(let i of restaurants) {
        result.push({
            name: i.name,
            _id: i._id,
            status: "OK"
        });
    }


    res.send(result);

});
router.get("/works", logged, async (req, res) => {
    
    const user = await getUser(
        req.user as string,
        { projection: {
            works: 1
        } }
    );

    if(!user) {
        return res.send({ error: "user" });
    }

    const { works } = user;

    const restaurants = await Restaurant().search(
        { _id: { $in: works } },
        { projection: {
            name: 1
        } }
    );


    res.send(restaurants);
});

router.get("/invitations", logged, async (req, res) => {
    

    const user = await getUser(req.user as string, { projeciton: { invitations: 1 } });

    const { invitations } = user;

    const result = [];

    for(let i of invitations!) {
        result.push({
            date: getDate(i.date),
            restaurant: await getRestaurantName(i.restaurantId!),
            role: i.role,
            _id: i._id,
            restaurantId: i.restaurantId,
        });
    }

    res.send(result);
});

router.post("/update", logged, async (req, res) => {
    const { field, value } = req.body;

    console.log(field, value);

    const $set: any = {};

    $set[field] = value;

    const update = await updateUser(
        req.user as string,
        { $set },
    );

    console.log(update);

    res.send(update);
});

router.post("/username/check", logged, async (req, res) => {
    const { username } = req.body;

    const format = /[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/;

    if(format.test(username) || username.length < 8) {
        return res.send(false);
    }

    const result = await byUsername(username, { projection: { _id: 1 } });

    res.send(!result);
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

    if(!foundUser || !foundUser.invitations) {
        log("failed invitation accepting", "no user found");
        return res.sendStatus(404);
    } else if(foundUser.invitations.length == 0) {
        log("failed invitation accepting", "no invitations found");
        return res.sendStatus(404);
    }

    let userI: Invitation = null!;

    
    
    for(let i of foundUser.invitations) {
        if(i._id.toString() == inv) {
            userI = i;
        }
    }
    
    if(!userI) {
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

    for(let i of foundR.invitations) {
        if(i._id.toString() == inv) {
            restaurantI = i;
        }
    }

    if(!restaurantI) {
        log("failed", `invitation doesnt exists in restaurant [${foundR._id.toString()}]`);
        return res.sendStatus(404);
    }

    const restaurant = foundR._id;

    const updatedRestaurant = await Restaurant(restaurant).update({ 
        $push: { 
                staff: { 
                _id: id(user), 
                joined: new Date(), 
                role: restaurantI!.role, 
                settings: restaurantI!.settings 
            },
        },
        $pull: {

            invitations: { _id: id(inv) }
        }
    });

    let userUpdate: UpdateResult = null!;
    let addJob = false;
    let addRestaurant = false;

    if(restaurantI.role == "cook" || restaurantI.role == "waiter") {
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


        if(addJob) {
            $push.works = restaurant;
        }
        if(addRestaurant) {
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
        restaurant: addRestaurant ? { name: restaurantName, _id: restaurant} : null
    });
});


export {
    router as UserRouter,
    session
}