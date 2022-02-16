import { Router } from "express";
import { client } from "../index";


const router = Router();
router.get("/all", async (req, res) => {
    const result = await client.db("ctraba").collection("restaurants")
        .find({ }, { projection: { name: 1, sname: 1, _id: 0 } }).toArray();

    res.send(result);
});
router.get("/full/:sname", async (req, res) => {
    const { sname } = req.params;
    const result = await client.db("ctraba").collection("restaurants")
        .findOne({ sname: sname }, { projection: { name: 1, sname: 1, _id: 1, phone: 1 } });

    res.send(result);
});
router.delete("/deleteRestaurant/:sname", async (req, res) => {
    const { sname } = req.params;

    // if(p != PASSWORD) {
    //     res.send({ acknowledged: false, info: "password" });
    //     return;
    // }

    const r = await client.db("ctraba").collection("restaurants")
        .findOne({ sname }, { projection: { sname: 1} });

    if(!r) {
        res.send({ acknowledged: false, info: "restaurant" });
        return;
    }

    const result = await Promise.all([
        client.db("ctraba").collection("restaurants").deleteOne({ sname }),
        client.db("ctraba").collection("kitchens").deleteOne({ restaurant: sname }),
        client.db("ctraba").dropCollection(sname),
        client.db("ctraba").dropCollection(`${sname}Customers`)
    ]);

    const [ one, two ] = result;

    if(one.acknowledged && two.acknowledged) {
        res.send({ acknowledged: true });
        return;
    }

    throw new Error("INSERTING RESTAURANT");
});




export { 
    router as AdminRouter
}
