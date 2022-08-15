import { Router } from "express";
import { ObjectId } from "mongodb";
import { allowed } from "../../middleware/restaurant";
import { Order } from "../../models/general";
import { DishHashTableUltra } from "../../utils/dish";
import { getDate, id } from "../../utils/functions";
import { Orders, Restaurant } from "../../utils/restaurant";
import { getUser } from "../../utils/users";


const router = Router({ mergeParams: true });


interface ConvertedOrder {
    user: {
        _id: any;
        name: string;
        avatar: any;
    };
    dishes: {
        name: string;
        price: number;
        _id: ObjectId;
    }[];
    _id: any;
    status: Order["status"];
    date: string;
    total: number;
    blacklisted: boolean;
    statusColor: "green" | "red" | "purple" | "orange";
} router.get("/orders", allowed("manager", "staff"), async (req, res) => {
    const { restaurantId } = req.params as any;

    const restaurant = await Restaurant(restaurantId).get({ projection: { blacklist: 1 } });

    if(!restaurant) {
        return res.sendStatus(404);
    }


    const orders = await Orders(restaurantId).history.many({ }, { limit: 12 });

    if(!orders || orders.length == 0) {
        return res.send(null);
    }

    const dishes = new DishHashTableUltra(restaurantId, { name: 1, price: 1 });

    const result = [];

    const isBlacklisted = (userId: string | ObjectId) => {
        if(!restaurant.blacklist) {
            return false;
        }
        for(let i of restaurant.blacklist!) {
            if(i.equals(userId)) {
                return true;
            }
        }
        return false;
    }

    for(let i of orders) {
        i.dishes = i.dishes.slice(0, 5);
        const one: ConvertedOrder = {
            status: i.status,
            _id: i._id,
            date: getDate(i.ordered!),
            user: (await getUser(i.customer, { projection: { name: 1, username: 1, avatar: 1, } }))! as any,
            dishes: [] as any,
            total: 0,
            statusColor: i.status == "progress" ? "purple" : i.status == "done" ? "green" : i.status == "removed" ? "red" : "orange",
            blacklisted: isBlacklisted(i.customer)
        };
        for(let j of i.dishes) {
            const dish = await dishes.get(j.dishId) as any;
            one.dishes.push(dish);
            one.total += dish.price;
        }
        result.push(one);
    }

    console.log(result);

    res.send(result);
});
router.get("/user/:userId", allowed("manager", 'staff'), async (req, res) => {
    const { userId, restaurantId } = req.params as any;

    const user = await getUser(userId, { projection: { blacklisted: 1, name: 1, username: 1, avatar: 1 } });

    const orders: any = await Orders(restaurantId).history.many({ customer: id(userId) }, { projection: { dishes: { dishId: 1 } } });


    const dishes = new DishHashTableUltra(restaurantId, { price: 1, name: 1, });
    
    let total = 0;
    const fav: any = {};
    
    for(let i of orders) {
        for(let j of i.dishes) {
            const dish = await dishes.get(j.dishId);
            if(dish) {
                total += dish.price!;
                if(fav[j.dishId.toString()]) {
                    fav[j.dishId.toString()] += 1;
                } else {
                    fav[j.dishId.toString()] = 1;
                }
            }
        }
    }
    
    let favorite: string;
    let ind = 0;

    for(let i of Object.keys(fav)) {
        if(ind < fav[i]) {
            ind = fav[i];
            favorite = i;
        }
    }

    const isBlacklisted = (id: string | ObjectId) => {
        if(!user.blacklisted) {
            return false;
        }
        for(let i of user.blacklisted!) {
            if(i.equals(id)) {
                return true;
            }
        }
        return false;
    }

    res.send({
        user,
        total,
        favorite: await dishes.get(favorite!),
        blacklisted: isBlacklisted(restaurantId),
    });
});

export {
    router as PeopleRouter
}