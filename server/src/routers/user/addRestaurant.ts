import { Router } from "express";
import { client } from "../..";
import { db } from "../../environments/server";
import { email, logged } from "../../middleware/user";
import { RestaurantSettings } from "../../models/components";
import { id } from "../../utils/functions";
import { Restaurant } from "../../utils/restaurant";
import { updateUser } from "../../utils/users";

const router = Router({ mergeParams: true });


router.post("/name", logged, email, async (req, res) => {
    const { name } = req.body;

    if(name.length < 4) {
        return res.sendStatus(422);
    }

    const settings: RestaurantSettings = {
        work: {
            maxOrdersCooking: 10,
        },
        customers: {
            maxDishes: 10,
            allowDistanceOrders: true,
            trust: 1,
            maxCustomers: 10,
            maxPrice: "unlimited",
            minPrice: 100,
        },
        dishes: {
            strictIngredients: false,
            types: 1,
        },
        payments: {

        },
    }




    const newRestaurant = {
        _id: id()!,
        name,
        owner: id(req.user as string),
        staff: [{ _id: id(req.user as string), role: "admin", joined: new Date(), prefers: [], settings: {} }],
        created: new Date(),
        theme: "orange",
        invitations: [],
        settings,
        tables: [],
        components: [],
        blacklist: [],
        sessions: [],
    };

    const work = {
        restaurant: newRestaurant._id,
        orders: [],
        waiter: [],
    };

    try {
        const result1 = await client.db(db).collection("restaurants")
            .insertOne(newRestaurant);
        const result2 = await client.db(db).createCollection(newRestaurant._id.toString());
        const result3 = await client.db(db).collection("work").insertOne(work);
        const result4 = await updateUser(
            req.user as string,
            {
                $push: {
                    restaurants: newRestaurant._id,
                    works: newRestaurant._id
                }
            }
        );

        const added = !!result1 && !!result2 && result3.acknowledged && result4.modifiedCount > 0;

        console.log("restaurant added: ", added);

        return res.send({ added, insertedId: newRestaurant._id })
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }

});
router.post("/theme/:restaurantId", logged, async (req, res) => {
    const { restaurantId } = req.params;
    const { color } = req.body;

    if(!restaurantId || restaurantId.length != 24) {
        return res.sendStatus(422);
    }

    if(!color || ![
        "red", "green", "orange", "brown", "black", "white", "gray", "sea", "blue", "pink", "purple",
    ].includes(color)) {
        return res.sendStatus(422);
    }

    const result = await Restaurant(restaurantId).update({ $set: { theme: color } });


    res.send({ success: result!.modifiedCount > 0 });
});

router.get("/name/:restaurantId", logged, async (req, res) => {
    const { restaurantId } = req.params;

    if(!restaurantId || restaurantId.length != 24) {
        return res.sendStatus(422);
    }

    const result = await Restaurant(restaurantId).get({ projection: { name: 1 } });

    res.send({ name: result ? result.name : null });
});





export {
    router as AddRestaurantRouter
}