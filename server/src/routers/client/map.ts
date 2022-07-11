import { Router } from "express";
import { ObjectId } from "mongodb";
import { Id, Session } from "../../models/components";
import { getDate, id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";


const router = Router();


router.get("/restaurants", async (_req, res) => {
    const result = await Restaurant().search({  }, { limit: 7 });


    res.send(result);
});

router.get("/restaurant/:restaurantId", async (req, res) => {
    const { restaurantId } = req.params;

    const sessions = await Restaurant(restaurantId).aggregate([
        { $unwind: "$sessions" },
        { $match: { "sessions.userId": id(req.user as string) } },
        { $project: { date: "$sessions.date", _id: "$sessions._id", number: "$sessions.number", type: "$sessions.type", dishes: "$sessions.dishes" } },
    ]);
    if (sessions[0]) {
        const { date, dishes, type, number } = sessions[0] as { _id: Id; number: number; type: "order" | "table", date: Date, dishes: { _id: ObjectId, dishId: ObjectId, comment: string; }[] };

        const ids = new Set<string>();

        for (let i of dishes) {
            ids.add(i.dishId.toString());
        }

        const convertDishes = await Restaurant(restaurantId).dishes
            .many({ _id: { $in: Array.from(ids).map(a => id(a)) } })
            .get({ projection: { name: 1, price: 1 } });

        const convertedDishes = [];

        for (let i of convertDishes) {
            if (i) {
                let count = 0;
                for (let i of dishes) {
                    if (i.dishId.equals(i._id)) {
                        count++;
                    }
                }
                convertedDishes.push({
                    ...i,
                    count,
                });
            }
        }


        res.send({
            dishes: convertDishes,
            date: getDate(date),
            type,
            number,
            hasToChange: false,
            askToChange: false,
        });
    };

});




export {
    router as MapRouter
}