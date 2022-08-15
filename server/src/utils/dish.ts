import { ObjectId } from "mongodb";
import { client } from "..";
import { dishesDBName } from "../environments/server";
import { Dish } from "../models/general";
import { id } from "./functions";
import { Restaurant } from "./restaurant";



async function findDishes(restaurant: string, name: string, options?: any): Promise<Dish[]> {

    let names = null;

    try {
        names = await client.db(dishesDBName).collection(restaurant)
            .find({}, { projection: { name: 1 } }).toArray();
    } catch (e) {
        console.error(e);
        throw new Error("at findDishes() phase 1");
    }

    if (!names) {
        return [];
    };

    const promises: Promise<Dish | null>[] = [];

    for (let { name: n, _id } of names) {
        if (n.substring(0, name.length).toLowerCase() === name.toLowerCase()) {
            // promises.push(getDishPromise(restaurant, { _id }, options));
        }
    }

    let result: Dish[] = [];

    try {
        const convert = await Promise.all(promises);

        for(let i in convert) {
            if(convert[i]) {
                result.push(convert[i]!);
            }
        }
    } catch (e) {
        console.error(e);
        throw new Error("at findDishes() phase 2");
    }

    return result;
}



class DishesHashTable {

    table: { [key: string]: Dish } = {}!;

    constructor(private dishes: Dish[], private projection: any = {}) {
        for(let i of dishes) {
            if(!this.table.hasOwnProperty(i._id.toString())) {
                this.table[i._id.toString()] = i;
            }
        }
    }


    get(id: string | ObjectId) {
        return this.table[id.toString()];
    }
}

class DishHashTableUltra {

    table: { [key: string]: Dish } = {};

    constructor(private restaurantId: string | ObjectId, private projection: any) { }


    async get(id: string | ObjectId) {
        if(!id) {
            return null;
        }
        const ext = this.table[id.toString()];
        if(!ext) {
            const dish = await Restaurant(this.restaurantId).dishes.one(id).get({ projection: this.projection });
            if(!dish) {
                return null;
            }
            this.table[id.toString()] = dish;
            return dish;
        }
        return ext;
    }
}



export {
    findDishes,
    DishesHashTable,
    DishHashTableUltra,
}