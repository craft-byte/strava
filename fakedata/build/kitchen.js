"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const client = new mongodb_1.MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);
main();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("START");
        try {
            yield client.connect();
            const user = yield client.db("ctrabaTest").collection("users")
                .findOne({ username: "account" }, { projection: { restaurants: 1, _id: 1 } });
            if (!user || user.restaurants.length == 0) {
                console.log("NO USER WITH A RESTAURANT");
                return;
            }
            const dishes = yield client.db("dishesTest").collection(user.restaurants[0].restaurantId.toString()).find().toArray();
            if (dishes.length == 0) {
                console.log("NO DISHES");
                return;
            }
            const result = [];
            for (let i = 0; i < 4; i++) {
                result.push({
                    _id: new mongodb_1.ObjectId(),
                    status: "progress",
                    customer: user._id,
                    ordered: Date.now() - Math.ceil(Math.random() * 10000),
                    id: "1234",
                    type: (["in", "out"][Math.ceil(Math.random() * 2) - 1]),
                    dishes: getDishes(dishes),
                    "socketId": null,
                });
            }
            const update = yield client.db("ordersTest").collection(user.restaurants[0].restaurantId.toString()).insertMany(result);
            console.log("DONE: ", update.insertedCount > 0);
        }
        catch (error) {
            throw error;
        }
    });
}
function getDishes(dishes) {
    const result = [];
    for (let i = 0; i < Math.ceil(Math.random() * 4); i++) {
        const dish = getDish(dishes);
        result.push({
            _id: new mongodb_1.ObjectId(),
            dishId: dish._id,
            comment: "",
            status: "ordered",
        });
    }
    return result;
}
function getDish(dishes) {
    const i = Math.ceil(Math.random() * dishes.length - 1);
    return dishes[i];
}
