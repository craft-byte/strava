import { ObjectId } from "mongodb";
import { DishesHashTable } from "../../../utils/dish";
import { id } from "../../../utils/functions";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant } from "../../../utils/restaurant";

async function convertDishes(restaurantId: string | ObjectId) {
    const orders = await Orders(restaurantId).many({ status: "progress" }, { projection: { _id: 1, ordered: 1, dishes: { status: 1, dishId: 1, _id: 1, id: 1, } } });

    const getIds = () => {
        const set = new Set<string>();
        for(let i of orders) {
            for(let j of i.dishes!) {
                set.add(j.dishId.toString());
            }
        }
        const result: ObjectId[] = [];
        for(let i of Array.from(set)) result.push(id(i)!);
        return result;
    }

    const dishes = await Restaurant(restaurantId).dishes.many({ _id: { $in: getIds() } }).get({ projection: { name: 1, image: 1 } });
    const table = new DishesHashTable(dishes);

    const result = [];

    for(let i of orders) {
        for(let j of i.dishes!) {
            if(j.status == "cooked") {
                result.push({
                    _id: j._id,
                    dishId: j.dishId,
                    time: getDelay(i.ordered!),
                    orderId: i._id,
                    id: i.id,
                });
            }
        }
    }

    return { orderDishes: result, dishes: table.table };
}

export {
    convertDishes
}