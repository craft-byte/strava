import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant, Stats } from "../../../utils/restaurant";
import { getUser } from "../../../utils/users";


const router = Router({ mergeParams: true });



router.get("/dish/:orderDishId/info", async (req, res) => {
    const { restaurantId, orderId, orderDishId } = req.params as any;

    const result: any = {
        ui: {
            showComponents: false,
            showRecipee: false,
            showUser: false,
            taken: false,
        },
        cooking: {},
        user: {},
        dish: {},
        order: {},
        taken: {}
    }


    const order = (await Orders(restaurantId).one(orderId).get());
    const dishesLength = (await Stats(restaurantId).order(orderId).get())?.dishes.length;


    if (!order) {
        return res.sendStatus(404);
    }
    const { userId, dishes, table, time } = order;
    const user = await getUser(userId!, { projection: { name: 1, username: 1, avatar: { binary: 1 } } });

    if (user) {
        result.ui.showUser = true;
        result.user = {
            name: user.name || user.username,
            avatar: user.avatar!.binary,
            _id: userId,
        }
        result.order = {
            time: getDelay(time!),
            table,
            dishes: dishesLength,
            _id: orderId,
        }
    } else {
        const result = await Orders(restaurantId).one(orderId).remove();

        if(result.modifiedCount == 0) {
            console.log("WATAFUUUUUUUUUUUUUUUUUUUUUUUCl");
        }
        return res.sendStatus(404);
    }



    const getDishId = () => {
        for(let i of dishes!) {
            if(i._id.equals(orderDishId)) {
                return i.dishId;
            }
        }
    }
    const dishId = getDishId();
    if(!dishId) {
        console.log("NOT DIHS ID????????????????????????????????????");
        return res.sendStatus(404);
    }


    const dish = await Restaurant(restaurantId).dishes.one(dishId!).get({ projection: { cooking: 1, name: 1, time: 1, image: { binary: 1, resolution: 1, } } });

    if (dish) {
        result.dish = {
            name: dish.name,
            image: { binary: dish.image!.binary, resolution: dish.image!.resolution == 1 ? "r1" : dish.image!.resolution == 1.33 ? "r2" : "r3" },
            time: dish.time,
        }
        if (dish.cooking) {
            if (dish.cooking.components) {
                result.ui.showComponents = true;
    
                const componentIds: ObjectId[] = [];
    
                for (let i of dish.cooking.components) {
                    componentIds.push(i._id);
                }
    
                const components = await Restaurant(restaurantId).components.getMany(componentIds, { amount: 1, name: 1, _id: 1, });
    
                if (components) {
                    const convertedComponents = [];
    
                    for (let i in components) {
                        if (!components[i]) {
                            console.log("NOT INPLEMETEDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
                            continue;
                        }
                        convertedComponents.push({
                            name: components[i].name,
                            amount: dish.cooking.components[i].amount,
                            of: components[i].amount,
                            _id: components[i]._id,
                        });
                    }
    
                    result.cooking.components = convertedComponents;
                }
            }
    
    
            if (dish.cooking.recipee) {
                result.ui.showRecipee = true;
                result.cooking.recipee = dish.cooking.recipee;
            }
    
        }
    } else {
        return res.sendStatus(404);
    }

    for(let i of dishes!) {
        if(i._id.equals(orderDishId)) {
            if(i.taken) {
                const user = await getUser(i.taken.userId, { projection: { name: 1, username: 1, avatar: 1, } });
                result.ui.taken = true;
                result.taken = {
                    time: getDelay(i.taken.time),
                    user: {
                        name: user.name || user.username,
                        avatar: user.avatar?.binary,
                        _id: user._id,
                    }
                }
            }
            break;
        }
    }




    res.send(result);
});



export {
    router as OrderRouter,
}