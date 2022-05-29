import { ObjectId } from "mongodb";
import { client } from "..";
import { db } from "../environments/server";
import { Dish } from "../models/general";
import { id } from "./functions";
import { Restaurant } from "./restaurant";


async function getDish(restaurant: string | ObjectId, dishId: string | ObjectId, options?: any): Promise<Dish> {
    let result: Dish | null = null;

    try {
        result = await getDishPromise(restaurant.toString(), { _id: id(dishId) }, options);
    } catch (e) {
        console.error(e);
        throw new Error("at getDish()");
    }

    return result as Dish;
}


function getDishPromise(restaurant: string, search: any, options?: any): Promise<Dish | null> {
    return client.db(db).collection(restaurant).findOne<Dish>(search, options);
}


async function getDishes(restaurant: string, search?: any, options?: any): Promise<Dish[]> {
    let result = [];

    try {
        result = await client.db(db).collection(restaurant)
            .find<Dish>(search, options).toArray();
    } catch (e) {
        console.error(e);
        throw new Error("at getDishes()");
    }

    return result!;
}


async function postDish(restaurant: string, newDish: Dish) {
    let result = null;
    
    try {
        result = await client.db(db).collection(restaurant)
            .insertOne(newDish);
    } catch (e) {
        console.error(e);
        throw new Error("at postDish()");
    }

    return result;
}


async function findDishes(restaurant: string, name: string, options?: any): Promise<Dish[]> {

    let names = null;

    try {
        names = await client.db(db).collection(restaurant)
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
            promises.push(getDishPromise(restaurant, { _id }, options));
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


async function removeDish(restaurant: string, dishId: string) {
    let result = null;

    try {
        result = await client.db(db).collection(restaurant).deleteOne({ _id: id(dishId) })
    } catch (e) {
        console.error(e);
        throw new Error("at removeDish()");
    }

    return result;
}

async function updateDish(restaurant: string, dishId: string, update: any) {
    let result = null;

    try {
        result = await client.db(db).collection(restaurant)
            .updateOne({ _id: id(dishId) }, update);
    } catch (e) {
        console.error(e);
        throw new Error("at updateDish()");
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

    constructor(private restaurantId: string, private projection: any) { }


    async get(id: string | ObjectId) {
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
    getDishes,
    postDish,
    findDishes,
    getDish,
    getDishPromise,
    DishesHashTable,
    DishHashTableUltra,
    removeDish,
    updateDish
}