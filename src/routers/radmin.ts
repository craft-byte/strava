import { ObjectId } from "bson";
import { Router } from "express";
import { db } from "./../environments/server";
import { client, upload } from "../index";
import { StatisticsRouter } from "./statistics";
import { readFileSync, unlinkSync } from "fs";
import { id } from "./functions";

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
router.post("/addDish/:restaurant", async (req, res) => {
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

    if(!from) {
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
            { $project: { sale: "$sales"} }
        ]).toArray();

    if(!result || !result[0]) {
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
    
    const newComponent = Object.assign(component, { _id: new ObjectId(), modified: new Date() });

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
            { $set: { 
                "components.$[s1].name": name, 
                "components.$[s1].price": price,
                "components.$[s1].amount": amount 
            } },
            { arrayFilters: [{"s1._id": new ObjectId(component) }] }
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

    if(!result || !result[0] || !result[0].component) {
        return res.send(null);
    }

    res.send(result[0].component);
});
router.patch("/users/all", async (req, res) => {
    const { text } = req.body;

    const found = await client.db(db).collection("users")
        .find({}, { projection: { username: 1 } }).toArray();

    const ids = [];
    
    for(let { username, _id } of found) {
        if(username.substring(0, text.length) == text) {
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


    
    newWorker._id = id(user);

    const isWorks = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: id(restaurant) } },
            { $unwind: "$staff" },
            { $match: { "staff._id": new ObjectId(user) } },
            { $project: { found: "hello" } }
        ]).toArray();

    console.log(isWorks);

    if(isWorks.length > 0) {
        return res.send({ error: "user", acknowledged: false });
    }


    const changes = await client.db(db).collection("restaurants")
        .updateOne(
            { _id: id(restaurant) },
            { $push: { staff: newWorker } }
        );

    console.log(changes);

    res.send({ newWorker, acknowledged: changes.acknowledged });

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




async function setSale(sname, id, sale, to) {


    const found = await client.db(db).collection(sname)
        .aggregate([
            { $match: { _id: new ObjectId(id) } },
            { $unwind: "$sales" },
            { $match: { "sales._id": new ObjectId(sale) } },
            { $project: { price: "$originalPrice", sale: "$sales" } }
        ]).toArray();

    if(!found || !found[0] || !found[0].price || !found[0].sale) {
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