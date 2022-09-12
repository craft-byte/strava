import { LargeNumberLike } from "crypto";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { isPromise } from "util/types";
import { Order } from "../../models/general";
import { getDate, id } from "../../utils/functions";
import { getRestaurantName } from "../../utils/other";
import { manyRestaurants, Orders, Restaurant } from "../../utils/restaurant";
import { getUser } from "../../utils/users";


const router = Router({ mergeParams: true });


interface HistoryOrder {
    restaurant: {
        name: string;
        _id: ObjectId;
    };
    order: {
        id: string;
        type: string;
        dishes: number;
        date: string;
        status: string;
        _id: ObjectId;
        money: {
            total: number;
            hst: number;
            subtotal: number;
        };
    };
};
router.get("/", async (req, res) => {
    
    const lenght = Number(req.query.length) || 5;

    if(isNaN(lenght)) {
        return res.sendStatus(422);
    }

    const result: 404 | HistoryOrder[] | null = await getHistory(req.user as string, lenght, 0);

    if(!result) {
        return res.send([]);
    }

    if(typeof result == "number") {
        return res.sendStatus(result);
    }

    res.send({ orders: result });
});


//
//  function
//
async function getHistory(userId: string, length: number, skip: number) {

    const result: HistoryOrder[] = [];

    const user = await getUser(userId, { projection: { orders: 1 } });

    if(!user) {
        return 404;
    }

    if(!user.orders || user.orders.length == 0) {
        return [];
    }


    const restaurantIds = [];
    const strs = new Set<string>();
    const ordersHash: { [restaurantId: string]: ObjectId[] } = {};
    const goThrough = user.orders!.splice(skip, length);
    if(goThrough.length == 0) {
        return null;
    }
    for(let i of goThrough) {
        strs.add(i.restaurantId.toString())
        if(ordersHash[i.restaurantId.toString()]) {
            ordersHash[i.restaurantId.toString()].push(i.orderId);
        } else {
            ordersHash[i.restaurantId.toString()] = [i.orderId];
        }
    };
    for(let i of Array.from(strs)) restaurantIds.push(id(i));
    
    

    const restaurants = await manyRestaurants({ _id: { $in: restaurantIds }, }, { projection: { name: 1 } });

    const ordersPromises = [];
    for(let restaurantId of Object.keys(ordersHash)) {
        for(let orderId of ordersHash[restaurantId]) {
            ordersPromises.push(Orders(restaurantId).history.one({ _id: id(orderId)}, { projection: { ordered: 1, money: 1, id: 1, type: 1, status: 1, dishes: { _id: 1 } } }))
        }
    }

    const orders = await Promise.all(ordersPromises);

    const getRestaurant = (orderId: ObjectId) => {
        for(let i of Object.keys(ordersHash)) {
            if(ordersHash[i].find(a => a.equals(orderId))) {
                for(let restaurant of restaurants) {
                    if(restaurant._id.equals(i)) {
                        return restaurant;
                    }
                }
            }
        }
    }

    for(let i of orders) {
        if(i) {
            result.push({
                restaurant: getRestaurant(i._id) as any,
                order: {
                    _id: i._id,
                    status: i.status,
                    id: i.id,
                    type: i.type == "in" ? "Table" : "Taken away",
                    money: i.money!,
                    date: getDate(i.ordered!),
                    dishes: i.dishes.length,
                }
            });
        }
    }

    console.log(result);


    return result;
}




export {
    router as HistoryRouter,
}