import { Router } from "express";
import { ObjectId } from "mongodb";
import { Order } from "../../models/Order";
import { Restaurant } from "../../utils/restaurant";
import { SessionRouter } from "./session";

const router = Router({ mergeParams: true });


interface LocalLocals {
    status: "loggedin" | "loggedout" | "noinfo";
    userId: string | null;
    order: Order;
    ct: string;
}


router.use("/session", SessionRouter);


router.get("/recommendations", async (req, res) => {
    const { restaurantId } = req.params as any;
    

    const dishes = await Restaurant(restaurantId).dishes.many({}).get({ projection: { general: 1, name: 1, price: 1, info: { time: 1, } } });
    
    const result = [];

    for(let dish of dishes) {
        result.push({
            general: dish.general,
            name: dish.name,
            price: dish.price,
            time: dish.info.time,
            _id: dish._id,
        });
    }

    res.send(result);
});

router.get("/dishImage/:dishId", async (req, res) => {
    const { restaurantId, dishId } = req.params as any;

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { image: { binary: 1, resolution: 1, } } });

    if(!dish) {
        return res.status(404).send({ reason: "DishNotFound" });
    }

    res.send(dish.image);
});


router.get("/dish/:dishId", async (req, res) => {
    const { dishId, restaurantId } = req.params as any;
    const { description, image, full } = req.query;

    const projection: any = { name: 1, price: 1, info: { time: 1, }, general: 1 };

    if(full) {
        projection.image = { binary: 1, resolution: 1 };
        projection.description = 1;
    }
    if(description) {
        projection.description = 1;
    }
    if(image) {
        projection.image = { binary: 1, resolution: 1 };
    }
    
    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection });

    if(!dish) {
        return res.sendStatus(404);
    }

    res.send({
        ...dish,
        time: dish?.info.time,
    });
});


export {
    router as OrderRouter,
}