import { ObjectId } from "mongodb";
import { Dish } from "../models/general";
import { Restaurant } from "./restaurant";


class DishesHashTable {

    table: { [key: string]: Dish } = {}!;

    constructor(private dishes: Dish[], private projection: any = {}) {
        for(let i of this.dishes) {
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

    add(dishes: Dish[]) {
        for(let i of dishes) {
            if(!this.table[i._id.toString()]) {
                this.table[i._id.toString()] = i;
            }
        }
    }
}



export {
    DishesHashTable,
    DishHashTableUltra,
}