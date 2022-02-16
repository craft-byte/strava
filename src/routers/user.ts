import { ObjectId } from "bson";
import { Router } from "express";
import { db } from "./../environments/server";
import { client } from "../index";
import { NewUser, NewRestaurant, LoginData } from "../models/user";
import { compare, makePassword } from "./functions";
import { SessionData } from "express-session";
import { RestaurantSettings } from "../models/radmin";

const router = Router();


const userProjection = {
    works: 1,
    invitations: 1,
    restaurants: 1,
    _id: 1,
    username: 1,
    name: 1,
    phone: 1
};

let session: SessionData;

router.post("/create", async (req, res) => {
    const { email, password, username } = <NewUser>req.body;

    const newPassword = makePassword(password);

    const similar = await client.db(db).collection("users")
        .findOne({ username }, { projection: { username: 1 } });

    if (similar) {
        res.send({ error: "username" });
        return;
    }

    const newUser = {
        email,
        created: new Date(),
        password: newPassword,
        username,
        invitations: [],
        works: [],
        restaurants: [],
        name: null,
        phone: null
    };

    const result = await client.db(db).collection("users")
        .insertOne(newUser);

    if (result.acknowledged) {
        session = req.session as SessionData;
        session.userid = result.insertedId.toString();
    }

    res.send({ acknowledged: result.acknowledged, user: { username, restaurants: [], works: [], invitations: [], _id: result.insertedId } });
});
router.patch("/login", async (req, res) => {
    const { username, password } = <LoginData>req.body;

    session = req.session as SessionData;

    const result = await client.db(db).collection("users")
        .findOne<{ password: string }>({ username }, { projection: { password: 1 } });

    if (!result) {
        res.send({ error: "user" });
        return;
    }


    if (compare(password, result.password)) {
        const user = await client.db(db).collection("users")
            .findOne({ username }, { projection: userProjection });
        res.send(user);
        session.userid = user._id;
    } else {
        res.send({ error: "password" });
    }

});
router.patch("/login/saved", async (req, res) => {
    const { _id } = req.body;

    if (!session) {
        res.send(null);
        return;
    }

    if (session.userid == _id) {
        const result = await client.db(db).collection("users")
            .findOne({ _id: new ObjectId(_id) }, { projection: userProjection });

        res.send(result);
        return;
    }
    res.send(null);
});
router.post("/addRestaurant", async (req, res) => {
    const { restaurant, _id } = <{ restaurant: NewRestaurant, _id: string }>req.body;

    const similar = await client.db(db).collection("restaurants")
        .findOne({ sname: restaurant.sname }, { projection: { sname: 1 } });

    if (similar) {
        res.send({ error: "similar" });
        return;
    }

    const ns = makePassword(restaurant.kitchenPassword);
    const na = makePassword(restaurant.adminPassword);

    delete restaurant.kitchenPassword;
    delete restaurant.adminPassword;

    const settings: RestaurantSettings = {
        work: {
            withNoAccount: false,
        },
        customers: {
            onlyTableOrders: true,
            onlyByQR: true,
        },
        dishes: {
            allTypes: false,
            strictDishCookingCheck: false,
            dishesComponents: true,
        },
        payments: {
            
        }
    }

    const forRestaurant = {
        ...restaurant,
        staffPassword: ns,
        adminPassword: na,
        owner: new ObjectId(_id),
        staff: [{ _id: new ObjectId(_id), role: "admin" }],
        created: new Date(),
        categories: [],
        tables: [],
        history: [],
        invitations: [],
        settings,
        components: []
    };



    const insertedRestaurant = await client.db(db).collection("restaurants")
        .insertOne(forRestaurant);
    client.db(db).createCollection(restaurant.sname);


    const work = { 
        restaurant: insertedRestaurant.insertedId, 
        kitchen: [], 
        waiter: [] 
    };
    client.db(db).collection("work").insertOne(work);





    const result2 = await client.db(db).collection("users")
        .updateOne({ _id: new ObjectId(_id) }, {
            $push: {
                restaurants: insertedRestaurant.insertedId,
                works: insertedRestaurant.insertedId
            }
        });

    if (result2.acknowledged && insertedRestaurant.acknowledged) {
        res.send({ acknowledged: true, insertedId: insertedRestaurant.insertedId });
        return;
    }

    res.send({ error: "wrong" });
});
router.get("/restaurants/:id", async (req, res) => {
    const { id } = req.params;

    const restaurants = (await client.db(db).collection("users")
        .findOne<{ restaurants: string[] }>({ _id: new ObjectId(id) }, { projection: { restaurants: 1 } })).restaurants;

    const result = [];

    for (let i of restaurants) {
        const restaurant = await client.db(db).collection("restaurants")
            .findOne({ _id: new ObjectId(i) }, { projection: { name: 1 } });
        result.push(restaurant);
    }


    res.send(result);
});
router.get("/userInfo/:id", async (req, res) => {
    const { id } = req.params;

    if (id.length !== 24) {
        res.send({});
        return;
    }

    const result = await client.db(db).collection("users")
        .findOne({ _id: new ObjectId(id) }, { projection: { username: 1, name: 1, works: 1, owns: 1, email: 1 } });

    res.send(result);
});
router.get("/invite/:userId/:restaurant", async (req, res) => {
    const { userId, restaurant } = req.params;

    [
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(userId) }, { $push: { invitations: restaurant } }),
        client.db(db).collection("restaurants")
            .updateOne({ _id: new ObjectId(restaurant) }, { $push: { invitations: userId } })
    ];

    res.send({});
});
router.delete('/invitation/:restaurant/:id', async (req, res) => {
    const { restaurant, id } = req.params;

    [
        client.db(db).collection("restaurants")
            .updateOne({ _id: new ObjectId(restaurant) }, { $pull: { invitations: id } }),
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(id) }, { $pull: { invitations: id } })
    ]

    res.send({});
});
router.get("/name/:id", async (req, res) => {
    const { id } = req.params;

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1, workers: { _id: 1 }, invitations: 1 } });

    res.send(result);
});
router.patch("/accept", (req, res) => {
    const { user, restaurant, answer } = req.body;

    const { _id } = user;

    const newUser = {
        _id: new ObjectId(_id)
    }

    if (answer) {
        client.db(db).collection("restaurants")
            .updateOne({ _id: new ObjectId(restaurant) }, {
                $push: { workers: newUser },
                $pull: { invitations: _id }
            }, { noResponse: true })
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(_id) }, { $push: { works: new ObjectId(restaurant) }, $pull: { invitations: restaurant } }, { noResponse: true })
    } else {
        client.db(db).collection("restaurants")
            .updateOne({ _id: new ObjectId(restaurant) }, { $pull: { invitations: _id } }, { noResponse: true })
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(_id) }, { $pull: { invitations: restaurant } }, { noResponse: true })
        }
        
    res.send({  });
});
router.patch("/removeUser", async (req, res) => {
    const { username, _id, password } = req.body;

    const user = await client.db(db).collection("users")
        .findOne<{ password: string }>(
            { username, _id: new ObjectId(_id) },
            { projection: { password: 1 } }
        );

    if (!user) {
        res.send({ error: "user" });
        return;
    }

    const oldPassword = user.password;

    if (!compare(password, oldPassword)) {
        res.send({ error: "password" })
        return;
    }

    const result = await client.db(db).collection("users")
        .deleteOne({ username, _id: new ObjectId(_id) }, { noResponse: true });

    res.send(result);

});
router.patch("/update/:user", (req, res) => {
    const { username, name, phone } = req.body;
    const { user } = req.params;


    if (!user || user.length == 0) {
        res.send({ acknowledged: false, error: "user" });
        return;
    }

    const changes: { username?: string; name?: string; phone?: string; } = {}


    if (username && username.length >= 1) {
        changes.username = username;
    }
    if (name && name.length >= 1) {
        changes.name = name;
    }
    if (phone && phone.length >= 1) {
        changes.phone = phone;
    }

    client.db(db).collection("users")
        .updateOne(
            { _id: new ObjectId(user) },
            {
                $set: {
                    ...changes
                }
            },
            { noResponse: true }
        );

    res.send({ acknowledged: true });
});
router.patch("/changePassword", async (req, res) => {
    const { username, password, newPassword, _id } = req.body;

    const user = await client.db(db).collection("users")
        .findOne<{ password: string }>(
            { username, _id: new ObjectId(_id) },
            { projection: { password: 1 } }
        );
    if (!user) {
        res.send({ error: "user", acknowledged: false });
        return;
    }

    if (!compare(password, user.password)) {
        res.send({ error: "password", acknowledged: false });
        return;
    }

    const result = await client.db(db).collection("users")
        .updateOne(
            { username, _id: new ObjectId(_id) },
            { $set: { password: makePassword(newPassword), token: null } }
        );

    res.send({ acknowledged: result.acknowledged });
});
router.patch("/removeUser", async (req, res) => {
    const { username, password, _id } = req.body;

    const user = await client.db(db).collection("users")
        .findOne<{ password: string; works: string[]; restaurants: string[]; }>(
            { username, _id: new ObjectId(_id) },
            {
                projection: {
                    password: 1,
                    restaurants: 1,
                    works: 1,
                }
            }
        );

    if (!user) {
        res.send({ acknowledged: false, error: "user" });
        return;
    }
    if (!compare(password, user.password)) {
        res.send({ acknowledged: false, error: "password" });
        return;
    }

    for (let i of user.works) {
        client.db(db).collection("restaurants")
            .updateOne({ _id: new ObjectId(i) }, { $pull: { workers: _id } }, { noResponse: true });
    }
    for (let i of user.restaurants) {
        const restaurant = await client.db(db).collection("restaurants")
            .findOne<{ workers: { userId: string }[] }>({ _id: new ObjectId(i) }, { projection: { workers: { username: 1 } } });
        for (let { userId } of restaurant.workers) {
            client.db(db).collection("users")
                .updateOne({ _id: new ObjectId(userId) }, { $pull: { works: "restaurant" } });
        }
    }

    const result = await client.db(db).collection("users")
        .deleteOne({ username, _id: new ObjectId(_id) });

    res.send({ acknowledged: result.acknowledged });
});
router.get("/restaurants/:user", async (req, res) => {
    const { user } = req.params;

    const result = await client.db(db).collection("users")
        .findOne({ _id: new ObjectId(user) }, { projection: { restaurants: 1 } });

    res.send(result);
});
router.patch("/confirm/:t", async (req, res) => {
    const { t } = req.params;


    switch (t) {
        case "restaurant":

            

            const { restaurant, user, password } = req.body;

            const foundUser = await client.db(db).collection("users")
                .findOne({ _id: new ObjectId(user) }, { projection: { restaurants: 1, password: 1 } });

            if(!foundUser) {
                res.send({ removed: false });
                return;
            }

            const { restaurants, password: foundPassword } = foundUser;

            const foundRestaurant = await client.db(db).collection("restaurants")
                .findOne({ name: restaurant }, { projection: { _id: 1 } });

            if(!foundRestaurant) {
                res.send({ removed: false })
                return;
            }
            const { _id } = foundRestaurant;

            for (let i of restaurants) {
                if (i.toString() === _id.toString() && compare(password, foundPassword)) {
                    const { sname, owner } = await client.db(db).collection("restaurants")
                        .findOne({ _id: new ObjectId(_id) }, { projection: { owner: 1, sname: 1 } });

                    const { workers, invitations } = (await client.db(db).collection("restaurants")
                        .findOne({ _id: new ObjectId(_id) }, { projection: { workers: 1, invitations: 1 } }));

                    for (let w of workers) {
                        client.db(db).collection("users")
                            .updateOne({ _id: new ObjectId(w._id) }, { $pull: { works: _id } }, { noResponse: true });
                    }
                    for (let i of invitations) {
                        client.db(db).collection("users")
                            .updateOne({ _id: new ObjectId(i) }, { $pull: { invitations: _id } })
                    }

                    await Promise.all([
                        client.db(db).collection("restaurants")
                            .deleteOne({ _id: new ObjectId(_id) }, { noResponse: true }),
                        client.db(db).dropCollection(sname),
                        client.db(db).collection("work")
                            .deleteOne({ restaurant: new ObjectId(_id) }, { noResponse: true }),
                        client.db(db).collection("users")
                            .updateOne({ _id: new ObjectId(owner) }, { $pull: { "restaurants": new ObjectId(_id) } }, { noResponse: true })
                    ]);

                    

                    res.send({ removed: true, id: _id.toString() });
                    return;
                }
            }
            res.send({ remove: false, });
            break;
        default:
            console.log("not restaurant?");
            break;
    }
});

export {
    router as UserRouter
}