import { Router } from "express";
import { getDate, id } from "../../utils/functions";
import { Orders, Restaurant } from "../../utils/restaurant";
import { checkSession } from "./functions";


const router = Router();


router.get("/restaurants", async (_req, res) => {
    const result = await Restaurant().search({  }, { limit: 7 });


    res.send(result);
});

router.get("/restaurant/:restaurantId", async (req, res) => {
    const { restaurantId } = req.params;


    const result: {
        session?: { dishes: any[]; date: string; _id: any; };
        restaurant?: { name: string; _id: any; tables: number[]; };
        canDoOrder?: boolean;
    } = {};


    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1, tables: 1, settings: 1, } });
    
    if(!restaurant) {
        return res.sendStatus(404);
    }

    result.canDoOrder = restaurant.settings!.customers.allowTakeAway!;
    result.restaurant = {
        name: restaurant.name!,
        _id: restaurant._id,
        tables: []
    };
    for(let i = 1; i < restaurant.tables! + 1; i++) {
        result.restaurant.tables.push(i);
    }

    
    const sessions = await Orders(restaurantId).many({ status: "ordering", customer: id(req.user as string) }, { projection: {} });

    console.log(sessions);

    if(sessions.length > 0) {
        const { connected, dishes, _id } = sessions[0];

        const ids = new Set<string>();

        for (let i of dishes!) {
            ids.add(i.dishId.toString());
        }

        const convertDishes = await Restaurant(restaurantId).dishes
            .many({ _id: { $in: Array.from(ids).map(a => id(a)) } })
            .get({ projection: { name: 1, price: 1 } });

        console.log(convertDishes);

        const convertedDishes = [];

        for (let i of convertDishes) {
            if (i) {
                let amount = 0;
                for (let j of dishes!) {
                    if ((j.dishId as any).equals(i._id)) {
                        amount++;
                    }
                }
                convertedDishes.push({
                    ...i,
                    price: i.price! / 100,
                    amount,
                });
            }
        }
        
        result.session = {
            _id,
            dishes: convertedDishes as any,
            date: getDate(connected!)
        }


        if(sessions.length > 1) {
            const sessionsCleaning = await Orders(restaurantId).deleteMany({ status: "ordering", customer: id(req.user as string), _id: { $ne: sessions[0]._id } });
            console.log("multiple sessions removed:", sessionsCleaning.deletedCount > 0);
        }
    }


    res.send(result);
});

router.post("/table/:restaurantId", async (req, res) => {
    const { restaurantId } = req.params;
    const { table } = req.body;

    const result = await checkSession(restaurantId, "in", table, req.user as string);

    const orderCooking = await Orders(restaurantId).aggregate([
        { $unwind: "$orders" },
        { $match: { "orders.userId": id(req.user as string) } },
        { $project: { order: "$orders" } },
    ]);

    if(orderCooking && orderCooking[0] && orderCooking[0].order) {
        result.askToChange = false;
    }

    res.send(result);
});


router.delete("/restaurant/:restaurantId/session", async (req, res) => {
    const { restaurantId } = req.params;

    // const result = await Restaurant(restaurantId).sessions.userId(req.user as string)
    //     .remove();

    const result = await Orders(restaurantId).deleteMany ({ customer: id(req.user as string) });

    console.log("session removed: ", result.deletedCount > 0);

    res.send({ updated: result.deletedCount > 0 });
});




export {
    router as MapRouter
}