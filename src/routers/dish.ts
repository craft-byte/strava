import { Router } from "express";
import { readFileSync, unlinkSync } from "fs";
import { ObjectId } from "mongodb";
import { db } from "./../environments/server";
import { client, upload } from "./../index";


const router = Router();



router.get("/get/:id/:restaurant", async (req, res) => {
    const { id, restaurant } = req.params;

    if(id.length !== 24 || restaurant.length !== 24) {
        res.send({});
        return;
    }

    const found = await client.db(db).collection("restaurants")
        .findOne<{ sname: string }>({ _id: new ObjectId(restaurant) }, { projection: { sname: 1 } });

    if(!found) {
        res.send({ error: "restaurant" });
        return;
    }


    const result = await client.db(db).collection(found.sname)
        .findOne({ _id: new ObjectId(id) });
    
    res.send({dish: result, sname: found.sname});
});
router.get("/categories/:restaurant", async (req, res) => {
    const { restaurant } = req.params;

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { categories: { name: 1 } } });

    res.send(result.categories);
});
router.post("/update/:restaurant/:id", async (req, res) => {
    upload(req, res, async (err) => {
        if(err) {
            console.error(err);
            throw new Error("UPDATING");
        }
        const path = `${process.cwd()}/uploads/${req.file.filename}`;
        const  { restaurant, id } = req.params;
        const image = readFileSync(path);
        const body = JSON.parse(req.body.body);

        const updated = { image, ...body };

        const update = await client.db(db).collection(restaurant)
            .updateOne({ _id: new ObjectId(id) }, { $set: updated });

        res.send(update);

        unlinkSync(path);
    });
});
router.delete("/remove/:sname/:id", async (req, res) => {
    const { id, sname } = req.params;

    const result = await client.db(db).collection(sname)
        .deleteOne({ _id: new ObjectId(id) });

    res.send(result);
});
router.get("/choose/:restaurant/:id/:is", async (req, res) => {
    const { restaurant, id, is } = req.params;

    const result = await client.db(db).collection(restaurant)
        .updateOne({ _id: new ObjectId(id) }, { $set: { choosen: is == "true" ? true : false } });

    res.send(result);
});
router.get("/stats/:sname/:id", async (req, res) => {
    const { sname,id } = req.params;

    const found = await client.db(db).collection(sname)
        .findOne<{ dates: any }>({ _id: new ObjectId(id) }, { projection: { dates: 1 } });

    res.send(found ? found.dates : null);
});

export {
    router as DishRouter
}