import { ObjectId, MongoClient } from "mongodb";

const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);


main();

async function main() {
    console.log("START");
    try {
        await client.connect();

        const user = await client.db("ctrabaTest").collection("users")
            .findOne({ username: "account" }, { projection: { restaurants: 1, _id: 1 } });

        if(!user || user.restaurants.length == 0) {
            console.log("NO USER WITH A RESTAURANT");
            return;
        }

        const dishes = await client.db("dishesTest").collection(user.restaurants[0].restaurantId.toString()).find().toArray();

        if(dishes.length == 0) {
            console.log("NO DISHES");
            return;
        }

        const result: {
            _id: ObjectId;
            status: "ordering" | "progress" | "done" | "removed";
            customer: ObjectId;
            socketId: string;
            method?: "card" | "cash";
            type: "in" | "out";
            id: string;
            ordered?: number;
            connected?: number;
        
            done?: {
                time: number;
                feedback?: {
                    text?: string;
                    rating?: number;
                };
            }
            removed?: {
                time: number;
                reason: string | "dishes";
                userId: ObjectId;
                userRole?: "owner" | "manager" | "admin" | null;
            };
            dishes: {
                _id: ObjectId;
                dishId: ObjectId;
                comment: string;
                status: "ordered" | "cooking" | "cooked" | "served" | "removed";
        
                name?: string;
                price?: number;
        
            
                cook?: ObjectId;
                waiter?: ObjectId;
        
                taken?: number;
                cooked?: number;
                served?: number;
            
                removed?: {
                    time: number;
                    userId: ObjectId;
                    userRole: "admin" | "cook" | "waiter" | "manager.cook" | "manager.waiter" | "manager" | "admin";
                    reason: "components" | "other" | string;
                }
            }[];
        }[] = [];

        for(let i = 0; i < 4; i++) {
            result.push({
                _id: new ObjectId(),
                status: "progress",
                customer: user._id,
                ordered: Date.now() - Math.ceil(Math.random() * 10000),
                id: "1234",
                type: (["in", "out"][Math.ceil(Math.random() * 2) - 1]) as any,
                dishes: getDishes(dishes),
                "socketId": null!,
            });
        }



        const update = await client.db("ordersTest").collection(user.restaurants[0].restaurantId.toString()).insertMany(result);

        console.log("DONE: ", update.insertedCount > 0);

    } catch (error) {
        throw error;
    }
}


function getDishes(dishes: any[]) {
    const result: {
        _id: ObjectId;
        dishId: ObjectId;
        comment: string;
        status: "ordered" | "cooking" | "cooked" | "served" | "removed";

        name?: string;
        price?: number;

    
        cook?: ObjectId;
        waiter?: ObjectId;

        taken?: number;
        cooked?: number;
        served?: number;
    
        removed?: {
            time: number;
            userId: ObjectId;
            userRole: "admin" | "cook" | "waiter" | "manager.cook" | "manager.waiter" | "manager" | "admin";
            reason: "components" | "other" | string;
        }
    }[] = [];

    for(let i = 0; i < Math.ceil(Math.random() * 4); i++) {
        const dish = getDish(dishes);
        result.push({
            _id: new ObjectId(),
            dishId: dish._id,
            comment: "",
            status: "ordered",
        });
    }

    return result;
}

function getDish(dishes: any[]) {
    const i = Math.ceil(Math.random() * dishes.length - 1);

    return dishes[i];
}