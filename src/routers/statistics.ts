import { Router } from "express";
import { ObjectId } from "mongodb";
import { client } from "./../index";
import { db } from "./../environments/server";


let c1 = true;

const router = Router();

router.get("/restaurant/:id", async (req, res) => {
    const { id } = req.params;

    if (id.length !== 24) {
        res.send({});
        return;
    }

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(id) }, { projection: { name: 1, sname: 1, history: 1, stats: 1 } });

    res.send(result);
});
router.get("/getCustomers/:restaurant", async (req, res) => {
    const { restaurant } = req.params;

    const result = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { orders: 1 } });

    if(!result || !result.orders) {
        res.send([]);
        return;
    }

    const datasets = [
        {
            label: "table",
            data: [],
            backgroundColor: "#ffd90071",
            borderColor: "#ffd900"
        },
        {
            label: "order",
            data: [],
            backgroundColor: "#00ff4471",
            borderColor: "#00ff44"
        }
    ];
    const labels = [];

    for (let i of result.orders) {
        const date = new Date(i.date)

        const label = `${date.getDate()}d`;

        let addLabel = true;

        for (let l in labels) {
            if (labels[l] === label) {
                for (let d in datasets) {
                    if (datasets[d].label === i.type) {
                        if (datasets[d].data[l]) {
                            datasets[d].data[l]++;
                        } else {
                            datasets[d].data[l] = 1;
                        }
                        break;
                    }
                }
                addLabel = false;
                break;
            }
        }

        if (addLabel) {
            labels.push(label);
            for (let D of datasets) {
                if (D.label === i.type) {
                    D.data[labels.length - 1] = 1;
                    break;
                }
            }
        }

    }

    res.send({ labels, datasets });
});
router.get("/getLastDayHours/:restaurant", async (req, res) => {
    const { restaurant } = req.params;

    const found = await client.db(db).collection("restaurants")
        .aggregate([
            { $match: { _id: new ObjectId(restaurant) } },
            { $unwind: "$orders" },
            { $match: { "orders.date": { $gte: new Date(Date.now() - 86400000) } } },
            {
                $group: {
                    _id: null,
                    orders: { $push: "$orders" }
                }
            }
        ]).toArray();

    const data = found && found[0] ? found[0].orders : [];

    const datasets = [
        {
            label: "table",
            data: [],
            backgroundColor: "#ffd90071",
            borderColor: "#ffd900"
        },
        {
            label: "order",
            data: [],
            backgroundColor: "#00ff4471",
            borderColor: "#00ff44"
        }
    ];
    const labels = [];

    for (let i of data) {
        const date = new Date(i.date)

        const label = `${date.getDate()}d/${date.getHours()}h`;

        let addLabel = true;

        for (let l in labels) {
            if (labels[l] === label) {
                for (let d in datasets) {
                    if (datasets[d].label === i.type) {
                        if (datasets[d].data[l]) {
                            datasets[d].data[l]++;
                        } else {
                            datasets[d].data[l] = 1;
                        }
                        break;
                    }
                }
                addLabel = false;
                break;
            }
        }

        if (addLabel) {
            labels.push(label);
            for (let D of datasets) {
                if (D.label === i.type) {
                    D.data[labels.length - 1] = 1;
                    break;
                }
            }
        }

    }

    res.send({ labels, datasets });
});
router.get("/findDishes/:restaurant/:text", async (req, res) => {
    const { restaurant, text } = req.params;

    const fr = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { sname: 1 } });

    if(!fr || !fr.sname) {
        res.send({});
        return;
    }

    const foundDishes = await client.db(db).collection(fr.sname)
        .find<{ name: string; _id: string }>({ }, { projection: { name: 1 } }).toArray();


    const result = [];

    for(let i of foundDishes) {
        const cutted = i.name.substring(0, text.length);
        if(cutted.toLowerCase() === text) {
            result.push(i);
        }
    }

    res.send(result);

});
router.patch("/dishesHours/:restaurant", async (req, res) => {
    if(c1) {
        console.log("/dishesHours request");
    }
    const { restaurant } = req.params;
    const { dishes } = req.body;

    const fr = await client.db(db).collection("restaurants")
        .findOne({ _id: new ObjectId(restaurant) }, { projection: { sname: 1 } });

    if(!fr || !fr.sname) {
        res.send({});
        return;
    }

    const promises: Promise<{ dates: { date: string; quantity: number }[]; name: string }>[] = [];

    for(let i of dishes) {
        promises.push(
            client.db(db).collection(fr.sname)
                .findOne<{ dates: { date: string; quantity: number }[], name: string }>({ _id: new ObjectId(i) }, { projection: { dates: 1, name: 1 } })
        );
    }

    const dishesData = await Promise.all(promises);

    const labels = [];
    const datasets = [];


    for(let d of dishesData) {

        const dataset = {
            label: d.name,
            data: [],
            backgroundColor: "#00ff4430",
            borderColor: "#00ff44"
        };
        
        for(let i of d.dates) {
            const date = new Date(i.date);
            const l = `${date.getDate()}d/${date.getHours()}h`;
            if(labels[labels.length - 1] === l) {
                dataset.data[labels.length - 1] += i.quantity;
            } else {
                labels.push(l);
                dataset.data.push(i.quantity);
            }
        }

        datasets.push(dataset);
    }

    console.log(labels, datasets);

    res.send({ labels, datasets });
});

export { router as StatisticsRouter };