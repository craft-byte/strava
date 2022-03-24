import { ObjectId } from "bson";
import { Router } from "express";
import { db } from "./../environments/server";
import { client, upload } from "../index";
import { StatisticsRouter } from "./statistics";
import { readFileSync, unlinkSync } from "fs";
import { getDate, id, log } from "./functions";
import { logged } from "../middleware/user";
import { sname } from "../middleware/restaurant";
import { Component, Restaurant } from "../models/radmin";

const router = Router();



router.get("/getRestaurant/:f/:id", async (req, res) => {
    const { f, id } = req.params;

    let projection;
    let wprojection;

    switch (f) {
        case "exists":
            projection = {
                name: 1,
                sname: 1
            }
            break;
        case "components":
            projection = {
                settings: 1,
                sname: 1,
                components: 1
            }
            break;
        case "main":
            projection = {
                name: 1,
                sname: 1,
                workers: 1,
                tables: 1
            };
            break;
        case "settings":
            projection = {
                settings: 1,
                name: 1,
                sname: 1
            };
            break;
        case "staff":
            projection = {
                staff: 1
            };
            break;
    };

    const result = { restaurant: null, work: null };

    if (projection) {
        result.restaurant = await client.db(db).collection("restaurants")
            .findOne({ _id: new ObjectId(id) }, { projection });
    }
    if (wprojection) {
        result.work = await client.db(db).collection("work")
            .findOne({ restaurant: new ObjectId(id) }, { projection: wprojection });
    }

    res.send(result);
});
router.get("/update/:f/:id", async (req, res) => {
    const { f, id } = req.params;

    const projection = {

    }

    switch (f) {
        case "dishes":
            projection["sname"] = 1;
            projection["settings"] = {
                dishes: 1
            }
            break;

        case "customers":
            projection["settings"] = {
                customers: 1
            }
            break;

        case "cooking":
            projection["components"] = 1;
            break;
    }

    const found = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection });

    res.send(found);
});
router.patch("/restaurants", async (req, res) => {
    const { ids } = req.body;

    const promises = [];

    for (let id of ids) {
        promises.push(client.db(db).collection("restaurants").findOne({ _id: new ObjectId(id) }, { projection: { name: 1 } }));
    }

    const result = await Promise.all(promises);

    res.send(result);
});
router.get("/dishes/:time/:sname", async (req, res) => {
    const { time, sname } = req.params;

    const result = await client.db(db).collection(sname)
        .find({}, { projection: { name: 1, price: 1, created: 1 } }).skip(+time * 7).limit(+time + 1 * 7).toArray();

    res.send(result);
});
router.post("/addDish/:restaurant", logged, sname, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            throw new Error("ADDING DISH");
        }
        let image = null;
        let path = null
        if (req.file) {
            path = `${process.cwd()}/uploads/${req.file.filename}`;
            image = readFileSync(path);
        }

        const { restaurant } = req.params;
        const body = JSON.parse(req.body.body);

        const newDish = {
            ...body,
            image,
            bought: 0,
            liked: 0,
            choosen: false,
            dates: [],
            sale: null,
            originalPrice: body.price,
            created: new Date(),
            sales: [],
            prices: []
        };

        const result = await client.db(db).collection(restaurant)
            .insertOne(newDish);

        res.send(result);

        if (path) {
            unlinkSync(path);
        }
    });
});
router.patch("/search/dishes/:sname", async (req, res) => {
    const { sname } = req.params;
    const { name } = req.body;

    const names = await client.db(db).collection(sname)
        .find({}, { projection: { name: 1 } }).toArray();

    if (!names) {
        res.send(404);
        return;
    };


    const promises = [];

    for (let { name: n, _id } of names) {
        if (n.substring(0, name.length).toLowerCase() === name.toLowerCase()) {
            promises.push(client.db(db).collection(sname).findOne({ _id: new ObjectId(_id) }, { projection: { name: 1, price: 1, created: 1 } }));
        }
    }

    const result = await Promise.all(promises);

    res.send(result);
});
router.get("/dish/full/:sname/:id", async (req, res) => {
    const { sname, id } = req.params;

    if (id.length !== 24) {
        res.status(404).send({});
        return;
    }

    const result = await client.db(db).collection(sname)
        .findOne({ _id: new ObjectId(id) }, { projection: { dates: 0 } });

    res.send(result);
});
router.delete("/dishes/remove/:sname/:id", async (req, res) => {
    const { sname, id } = req.params;

    const result = await client.db(db).collection(sname)
        .deleteOne({ _id: new ObjectId(id) });

    res.send(result);
});
router.patch("/dish/update/:sname/:id", async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            throw new Error("ADDING DISH");
        }
        let image = null;
        let path = null
        if (req.file) {
            path = `${process.cwd()}/uploads/${req.file.filename}`;
            image = readFileSync(path);
        }

        const { sname, id } = req.params;
        const body = JSON.parse(req.body.body);

        const changes = body;

        changes.originalPrice = changes.price;

        if (image) {
            changes.image = image;
        }

        const result = await client.db(db).collection(sname)
            .updateOne({ _id: new ObjectId(id) }, { $set: { ...changes } });

        res.send(result);

        if (path) {
            unlinkSync(path);
        }
    });
});
router.patch("/settings/:restaurant/:type/:field", async (req, res) => {
    const { type, restaurant, field } = req.params;
    const { setTo } = req.body;

    const set = {};
    set[`settings.${type}.${field}`] = setTo;


    const result = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            { $set: set }
        );


    log(result.modifiedCount > 0 ? "success" : "failed", `changing setting [${type}] field [${field}] to [${setTo}]`);

    res.send(result);
});
router.patch("/add/:sname/:dish", async (req, res) => {
    const { sname, dish } = req.params;
    const { price, name } = req.body;

    const _id = new ObjectId();
    const date = new Date();

    await client.db(db).collection(sname)
        .updateOne(
            { _id: new ObjectId(dish) },
            { $push: { sales: { name, _id, cost: price, created: date } } }
        );

    res.send({ _id: _id.toString(), date });
});
router.delete("/sale/:sname/:dish/:id", async (req, res) => {
    const { sname, dish, id } = req.params;

    console.log("SALE REMOVED");

    const result = await client.db(db).collection(sname)
        .updateOne(
            { _id: new ObjectId(dish) },
            { $pull: { sales: { _id: new ObjectId(id) } } }
        );

    res.send(result);
});
router.patch("/use/:sname/:dish/:sale", async (req, res) => {
    const { sname, dish: id, sale } = req.params;
    const { from, to } = req.body;


    let changes;

    if (!from) {
        changes = await setSale(sname, id, sale, to);
        console.log("NOW");
    } else {
        setTimeout(async () => {
            console.log("TIMED OUT");
            changes = await setSale(sname, id, sale, to);
        }, new Date(from).getTime() - Date.now());
    }

    res.send(changes);
});
router.get("/dish/sale/:sname/:dish/:sale", async (req, res) => {
    const { sname, dish, sale } = req.params;

    const result = await client.db(db).collection(sname)
        .aggregate([
            { $match: { _id: new ObjectId(dish) } },
            { $unwind: "$sales" },
            { $match: { "sales._id": new ObjectId(sale) } },
            { $project: { sale: "$sales" } }
        ]).toArray();

    if (!result || !result[0]) {
        res.send(null);
        return
    }

    res.send(result[0].sale);
});
router.delete("/dish/remove/sale/:sname/:id/:price", async (req, res) => {
    const { sname, id, price } = req.params;

    const result = await client.db(db).collection(sname)
        .updateOne(
            { _id: new ObjectId(id) },
            { $set: { sale: null, price: +price } }
        );

    res.send(result);
});
router.get("/addTable/:restaurant", async (req, res) => {
    const { restaurant } = req.params;

    const found = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { tables: { number: 1 } } });

    if (!found) {
        res.send({ error: true });
        return;
    }

    let last = 1;
    for (let i of found.tables) {
        if (i.number === last) {
            last = i.number + 1;
        } else {
            break;
        }
    }

    const _id = new ObjectId();

    client.db(db).collection("restaurants")
        .updateOne({ _id: new ObjectId(restaurant) },
            { $push: { tables: { number: last, taken: false, users: [], _id } } }, { noResponse: true });

    res.send({ number: last, _id: _id.toString() });
});
router.post("/components/add/:id", async (req, res) => {
    const { id } = req.params;
    const { component } = req.body;

    const newComponent = Object.assign(
        component, 
        { 
            _id: new ObjectId(), 
            modified: new Date(),
            uses: [],
            history: []
        }
    );

    await client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(id) },
            { $push: { components: newComponent } }
        );

    res.send(newComponent);
});
router.delete("/components/remove/:restaurant/:component", async (req, res) => {
    const { restaurant, component } = req.params;

    const result = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            { $pull: { components: { _id: new ObjectId(component) } } }
        );

    res.send(result);
});
router.patch("/components/edit/:restaurant/:component", async (req, res) => {
    const { restaurant, component } = req.params;
    const { changed: { name, price, amount } } = req.body;

    const result = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            {
                $set: {
                    "components.$[s1].name": name,
                    "components.$[s1].price": price,
                    "components.$[s1].amount": amount
                }
            },
            { arrayFilters: [{ "s1._id": new ObjectId(component) }] }
        );

    res.send(result);
});
router.get("/components/get/:restaurant/:id", async (req, res) => {
    const { restaurant, id } = req.params;

    const result = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: new ObjectId(restaurant) } },
            { $unwind: "$components" },
            { $match: { "components._id": new ObjectId(id) } },
            { $project: { component: "$components" } }
        ]).toArray();

    if (!result || !result[0] || !result[0].component) {
        return res.send(null);
    }

    res.send(result[0].component);
});
router.patch("/users/all", async (req, res) => {
    const { text } = req.body;

    const found = await client.db(db).collection("users")
        .find({}, { projection: { username: 1 } }).toArray();

    const ids = [];

    for (let { username, _id } of found) {
        if (username.substring(0, text.length) == text) {
            ids.push(new ObjectId(_id));
        }
    }

    const result = await client.db(db).collection("users")
        .find({ _id: { $in: ids } }, { projection: { name: 1, username: 1, avatar: 1 } }).toArray();

    res.send(result);
});
router.post("/worker/add/:restaurant/:user", async (req, res) => {
    const { restaurant, user } = req.params;
    const { newWorker } = req.body;

    log("ADDING WORKER ===");

    const isWorks = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: id(restaurant) } },
            { $unwind: "$staff" },
            { $match: { "staff._id": new ObjectId(user) } },
            { $project: { found: "hello" } }
        ]).toArray();

    if (isWorks.length > 0) {
        return res.sendStatus(404).send({ error: "user", acknowledged: false });
    }

    
    const invitationId = id();

    const restaurantInviting = {
        _id: invitationId,
        user: id(user), 
        joined: new Date(),
        role: newWorker.role,
        settings: newWorker.settings || null
    }
    const userInviting = {
        _id: invitationId,
        restaurant: id(restaurant),
        joined: new Date(),
        role: newWorker.role,
    }


    const changes = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: id(restaurant) },
            { $push: { invitations: restaurantInviting } }
        );
    const changes2 = await client.db(db).collection("users")
        .updateOne(
            { _id: id(user) },
            { $push: { invitations: userInviting } }
        );

    if(changes.acknowledged) {
        log("succeed", `adding user [${user}] to restaurant [${restaurant}] invitations`);
    } else {
        log("failed", `adding user [${user}] to restaurant [${restaurant}] invitations`);
    }

    if(changes2.acknowledged) {
        log("succeed", `adding restaurant [${restaurant}] to user [${user}] invitations`);
    } else {
        log("failed", `adding restaurant [${restaurant}] to user [${user}] invitations`);
    }

    log("END ADDING WORKER ===");

    res.send({ user: restaurantInviting, acknowledged: changes.modifiedCount > 0 });
});
router.get("/user/get/:id", async (req, res) => {
    const { id: user } = req.params;

    const result = await client.db(db).collection("users")
        .findOne(
            { _id: id(user) },
            { projection: { name: 1, username: 1, avatar: 1, } }
        );

    res.send(result);
});
router.get("/user/work/:restaurant/:id", async (req, res) => {
    const { id: user, restaurant } = req.params;

    const result1 = await client.db(db).collection("users")
        .findOne({ _id: id(user) }, { projection: { avatar: 1, name: 1, username: 1 } })

    let result2 = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: id(restaurant) } },
            { $unwind: "$staff" },
            { $match: { "staff._id": id(user) } },
            { $project: { worker: "$staff" } }
        ]).toArray();

    let worker;

    if (!result2 || result2.length == 0) {
        worker = null;
    } else {
        worker = result2[0].worker;
    }

    res.send({ user: result1, worker });
});
router.patch("/worker/settings/set/:restaurant/:workerId", logged, async (req, res) => {
    const { workerId, restaurant } = req.params;
    const { setTo, settingName } = req.body;

    let changes = {};
    changes["staff.$[s1].settings." + settingName] = setTo;

    const request = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: new ObjectId(restaurant) },
            { $set: changes },
            { arrayFilters: [{ "s1._id": new ObjectId(workerId) }] }
        );

    log("changing ['", settingName, "'] to ['", setTo, "'] result:", request.acknowledged);

    res.send(request);
});
router.patch("/worker/set/role/:restaurant/:user", async (req, res) => {
    const { restaurant, user } = req.params;
    const { setTo } = req.body;

    const changes = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: id(restaurant) },
            { $set: { "staff.$[s1].role": setTo } },
            { arrayFilters: [{ "s1._id": id(user) }] }
        );

    if (changes.acknowledged) {
        log("role changed ['", user, "'] to ", setTo);
    } else {
        log("failed role changed ['", user, "'] to ", setTo);
    }

    res.send(changes);
});
router.patch("/worker/fire/:restaurant/:user", async (req, res) => {
    const { restaurant, user } = req.params;
    const { feedback } = req.body;


    const foundWorker = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: id(restaurant) } },
            { $unwind: "$staff" },
            { $match: { "staff._id": id(user) } },
            { $project: { worker: "$staff" } }
        ]).toArray();

    if(!foundWorker || foundWorker.length == 0) {
        log("no worker found ['", user, "']");
        res.send(404);
        return;
    }

    const worker = foundWorker[0].worker;

    const result = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: id(restaurant) },
            { $pull: { staff: { _id: id(user) } } }
        );


    log("FIRING === ");

    if (result.modifiedCount > 0) {
        log("fired user ['", user, "'] from restaurant ['", restaurant, "']");
    } else {
        log("failed firing user ['", user, "'] from restaurant ['", restaurant, "']");
    }

    const newFeedback = {
        restaurant: id(restaurant),
        feedback,
        role: worker.role,
        worked: calculateTime(worker.joined) 
    };

    const result2 = await client.db(db).collection("users")
        .updateOne(
            { _id: id(user) },
            { 
                $pull: { works: id(restaurant) },
                $push: { feedbacks: newFeedback }
            }
        );

    if (result2.modifiedCount > 0) {
        log("removed restaurant ['", restaurant, "'] from user works ['", user, "']");
    } else {
        log("failed removed restaurant ['", restaurant, "'] from user works ['", user, "']");
    }

    log("END FIRING === ");

    res.send(result)
});
router.get("/feedbacks/:id", async (req, res) => {
    const { id } = req.params;

    log(`getting users ['${id}'] feedbacks`);

    const user = await client.db(db).collection("users")
        .findOne({ _id: new ObjectId(id) }, { projection: { feedbacks: 1 } });

    if(!user) {
        res.sendStatus(404);
        return;
    }
    if(!user.feedbacks) {
        res.send([]);
        return;
    }

    const result = [];

    for(let i of user.feedbacks) {
        const { role, worked, feedback: { comment, stars }, restaurant } = i;


        result.push({
            role: getRole(role),
            worked: getWorked(worked),
            comment,
            stars,
            restaurant: await getRestaurantName(restaurant)
        });
    }

    res.send(result);

});
router.get("/invitings/get/:restaurant", async (req, res) => {
    const { restaurant } = req.params;

    const convert = await client.db(db).collection("restaurants")
        .findOne({ _id: id(restaurant) }, { projection: { invitations: 1 } });

    if(!convert || !convert.invitations) {
        return res.sendStatus(404);
    }


    const promises = [];
    const concat = [];


    for(let { _id, user, role, joined } of convert.invitations) {
        promises.push(client.db(db).collection("users").findOne({ _id: user }, { projection: { name: 1, username: 1 } }));
        concat.push({ _id, role, joined: getDate(joined), user });
    }

    
    const names = await Promise.all(promises);

    const result = [];

    for(let i in concat) {
        const name = names[i].name || names[i].username;
        result.push(Object.assign(concat[i], { name }));
    }

    res.send(result);
});
router.delete("/invitation/remove/:restaurant/:user/:id", async (req, res) => {
    const { restaurant, user, id: iid } = req.params;

    log("", "REMOVING INVITATION STARTED");

    const changes1 = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: id(restaurant) },
            { $pull: { invitations: { _id: id(iid) } } }
        );

    const changes2 = await client.db(db).collection("users")
        .updateOne(
            { _id: id(user) },
            { $pull: { invitations: { _id: id(iid) } } }
        );

    
    if(changes1.modifiedCount > 0) {
        log("success", `removed invitation from restaurant [${restaurant}]`);
    } else {
        log("failed", `removed invitation from restaurant [${restaurant}]`);
    }

    if(changes2.modifiedCount > 0) {
        log("success", `removed invitation from user [${restaurant}]`);
    } else {
        log("failed", `removed invitation from user [${restaurant}]`);
    }

    log("", "REMOVING INVITATION END");


    res.send({ acknowledged: changes1.modifiedCount > 0 && changes2.modifiedCount > 0 });
});
router.patch("/components/find/:restaurant", async (req, res) => {
    const { restaurant } = req.params;
    const { searchText } = req.body;

    // log("info", "component searching");

    if(!searchText) {
        log("failed", "no search text");
        return res.send([]);
    }

    const r = await client.db(db).collection("restaurants")
        .findOne<{ components: Component[] }>({ _id: id(restaurant) }, { projection: { components: 1 } });


    if(!r) {
        log("failed", "no restaurant found", restaurant);
        return res.sendStatus(404);
    }
    if(!r.components || r.components.length == 0) {
        log("failed", "no components", restaurant);
        return res.send({ error: "components" });
    }

    const result = [];

    for(let i of r.components) {
        if(i.name.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()) {
            result.push({ name: i.name, _id: i._id, type: getComponentType(i.type) });
        }
    }


    res.send(result);
});
router.get("/cooking/dish/:restaurant/:sname/:id", async (req, res) => {
    const { restaurant, sname, id: dish } = req.params;

    const workers = await getWorkersForCooking(restaurant, dish);
    const { cooking, name } = await getDish(sname, dish, { cooking: 1, name: 1 });
    const sendName = name.toLowerCase();
    
    


    if(!cooking) {
        res.send({ components: [], recipee: "", name: sendName, workers });
        return;
    }

    const { components: c } = await getById(restaurant, { components: 1 });
    const { recipee, components } = cooking; 
    const finalComponents = [];

    

    if(components) {
        for(let i of components) {
            for(let j in c) {
                if(c[j]._id.toString() == i._id.toString()) {
                    const { _id, name, type } = c[j];
                    finalComponents.push({
                        _id,
                        name,
                        type: getComponentType(type),
                        value: i.value
                    });
                }
            }
        }
    }
    
    res.send({ components: finalComponents, recipee, name: sendName, workers });
});
router.patch("/cooking/set", async (req, res) => {
    const { 
        cooking: { components, recipee, workers }, 
        info: { sname, restaurantId, dishId } 
    } = req.body;


    const cooking = { recipee, components: [], prefered: [] };


    for(let i of workers) {
        cooking.prefered.push(id(i));
    }

    for(let i of components) {
        cooking.components.push({ value: i.value, _id: id(i._id) });
        const query = { $push: { "components.$[s1].uses": { dish: dishId, value: i.value } } }
        client.db(db).collection("restaurants")
            .updateOne(
                { _id: id(restaurantId) },
                query,
                { arrayFilters: [ { "s1._id": id(i._id) } ] }
            );
    };

    if(workers.length > 0) {
        for(let i of workers) {
            client.db(db).collection("restaurants")
                .updateOne(
                    { _id: id(restaurantId) }, 
                    { $push: { "staff.$[s1].prefers": dishId } }, 
                    { arrayFilters: [ { "s1._id": id(i) } ] }
                );
        }
    }


    const update1 = await client.db(db).collection(sname)
        .updateOne(
            { _id: id(dishId) },
            { $set: { cooking } }
        );

    if(update1.modifiedCount > 0) {
        log("success", "set cooking to dish", dishId);
        res.send({ success: true });
    } else {
        log("failed", "set cooking to dish", dishId);
        res.send({ success: false });
    }

});


function getComponentType(small: string) {
    switch (small) {
        case "k":
            return "Kilogram";
        case "g":
            return "Gram";
        case "p":
            return "Piece";
    }
}
async function setSale(sname, id, sale, to) {


    const found = await client.db(db).collection(sname)
        .aggregate([
            { $match: { _id: new ObjectId(id) } },
            { $unwind: "$sales" },
            { $match: { "sales._id": new ObjectId(sale) } },
            { $project: { price: "$originalPrice", sale: "$sales" } }
        ]).toArray();

    if (!found || !found[0] || !found[0].price || !found[0].sale) {
        console.log("something went wrong!");
        return null;
    }

    const { price, sale: { cost } } = found[0];


    const newPrice = price - price / 100 * cost;

    await client.db(db).collection(sname)
        .updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    price: newPrice,
                    sale: {
                        _id: new ObjectId(sale),
                        to
                    }
                }
            }
        );

    return { price: newPrice };
}
function calculateTime(d: Date) {
    return Date.now() - new Date(d).getTime();
}
function getRole(role: "manager" | "cook" | "waiter" | "admin") {
    switch (role) {
        case "manager":
            return "Manager";
        case "cook":
            return "Cook";
        case "waiter":
            return "Waiter";
        case "admin":
            return "Admin";
    }
}
function getWorked(time: number) {
    return `${Math.floor(time / 86400000)} days`;
}
async function getRestaurantName(restaurant: string) {
    const found = await client.db(db).collection("restaurants")
        .findOne({ _id: restaurant }, { projection: { name: 1 } });

    if(!found) {
        return "Removed restaurant";
    } else {
        return found.name;
    }

}
async function getWorkersForCooking(restaurant: string, dish: string) {
    const { staff } = await getById(restaurant, { staff: { role: 1, _id: 1, cooks: 1 } });

    const userPromises = [];

    for(let i = 0; i < staff.length; i++) {
        if(staff[i].role == "cook") {
            userPromises.push(getUserPromise({ _id: staff[i]._id }, { avatar: 1, name: 1, username: 1 }));
        } else {
            staff.splice(i, 1);
            i--;
        }
    }

    let users = null;

    try {
        users = await Promise.all(userPromises);
    } catch (e) {
        console.error(e);
        throw new Error("at getWorkersForCooking() getting users");
    }

    const result = [];

    if(users.length == 0) {
        return [];
    }

    for(let i in users) {
        const a = {
            name: users[i].name || users[i].username,
            avatar: users[i].avatar || null,
            choosen: false,
            _id: users[i]._id
        };
        if(staff[i].cooks) {
            for(let j of staff[i].prefers) {
                if(j.toString() == dish){
                    a.choosen = true;
                    break;
                }
            }
        }

        result.push(a);
    }

    return result;
}
async function getById(restaurantId: string, projection: any): Promise<Restaurant> {
    try {
        return await client.db(db).collection("restaurants").findOne({ _id: id(restaurantId) }, { projection }) as Restaurant;
    } catch(e) {
        console.error(e);
        throw new Error("at getById()");
    }
}
async function getDish(sname: string, dish: string, projection: any) {
    try {
        return await client.db(db).collection(sname)
            .findOne({ _id: id(dish) }, { projection });
    } catch (e) {
        console.error(e);
        throw new Error("at getDish()");
    }
}
function getUserPromise(filter: any, projection: any) {
    return client.db(db).collection("users").findOne(filter, { projection });
}
async function getUser(filter: any, projection: any) {
    try {
        return await getUserPromise(filter, projection);
    } catch (e) {
        console.error(e);
        throw new Error("at getUser()");
    }
}


router.delete("/remove/:id", async (req, res) => {
    const { id } = req.params;

    const { sname, owner } = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: { owner: 1, sname: 1 } });

    const { workers, invitations } = (await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: { workers: 1, invitations: 1 } }));

    for (let w of workers) {
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(w._id) }, { $pull: { works: id } }, { noResponse: true });
    }
    for (let i of invitations) {
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(i) }, { $pull: { invitations: id } })
    }

    const result = await Promise.all([
        client.db(db).collection("restaurants")
            .deleteOne({ _id: new ObjectId(id) }, { noResponse: true }),
        client.db(db).dropCollection(sname),
        client.db(db).collection("work")
            .deleteOne({ restaurant: new ObjectId(id) }, { noResponse: true }),
        client.db(db).collection("users")
            .updateOne({ _id: new ObjectId(owner) }, { $pull: { "restaurants": new ObjectId(id) } }, { noResponse: true })
    ]);

    res.send(result);
});


router.use("/statistics", StatisticsRouter);

export {
    router as RadminRouter
}