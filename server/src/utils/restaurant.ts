import { AggregateOptions, AnyBulkWriteOperation, Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { client } from "..";
import { dishesDBName, historyDBName, mainDBName, sessionsDBName } from "../environments/server";
import { Dish } from "../models/general";
import { Restaurant as RestaurantType } from "../models/Restaurant";
import { id } from "./functions";
import { updateUser } from "./users";



function Restaurant(restaurantId?: string | ObjectId) {
    return {
        remove: async () => {
            try {
                const restaurant = await Restaurant(restaurantId).get({ projection: { staff: 1, info: { owner: 1 }, invitations: 1 } });

                if (!restaurant) {
                    return null;
                }

                for (let i of restaurant.staff!) {
                    const result = await updateUser({ _id: id(i.userId) }, { $pull: { works: id(restaurantId)!, restaurants: { restaurantId: id(restaurantId)! } } });

                    console.log("user works deleted: ", result.ok == 1);
                }

                // for (let i of restaurant.invitations!) {
                //     const result = await updateUser(i._id, { $pull: { invitations: { _id: id(i._id) } } });

                //     console.log("user invitation deleted: ", result.ok == 1);
                // }

                const result1 = await updateUser({ _id: (restaurant.info?.owner!) }, { $pull: { restaurants: { restaurantId: id(restaurantId)! } } });

                console.log("owner restaurant removed: ", result1.ok == 1);


                const result2 = await client.db(mainDBName).collection("restaurants").deleteOne({ _id: id(restaurantId) });

                console.log("restaurant deleted: ", result2.deletedCount > 0);



                const result3 = await client.db(sessionsDBName).dropCollection(restaurantId!.toString());
                const result4 = await client.db(dishesDBName).dropCollection(restaurantId!.toString());
                const result5 = await client.db(historyDBName).dropCollection(restaurantId!.toString());

                console.log("orders collection removed: ", result3);
                console.log("dishes collection removed: ", result4);
                console.log("history collection removed: ", result5);

                return result1.ok == 1 && result2.deletedCount > 0 && result4 && result3;

            } catch (e) {
                throw e;
            }
        },
        aggregate: async <T extends Document>(pipeline: any[]): Promise<T[]> => {
            try {
                return await client.db(mainDBName).collection("restaurants")
                    .aggregate<T>([
                        { $match: restaurantId ? { _id: id(restaurantId) } : {} },
                        ...pipeline
                    ]).toArray();
            } catch (e) {
                console.error(e);
                throw new Error("at aggregateRestaurant()");
            }
        },
        search: async (search: any, options: any = {}): Promise<RestaurantType[]> => {
            try {
                return await client.db(mainDBName).collection("restaurants")
                    .find<RestaurantType>(search, options).toArray();
            } catch (err) {
                console.error(err);
                throw new Error("at getRestaurants()");
            }
        },
        update: async (update: UpdateFilter<RestaurantType>, options: FindOneAndUpdateOptions = {}): Promise<{ restaurant: RestaurantType; ok: 1 | 0 }> => {
            try {
                const result = await client.db(mainDBName).collection<RestaurantType>("restaurants")
                    .findOneAndUpdate({ _id: id(restaurantId) }, update, { returnDocument: "after", ...options });;

                return { restaurant: result.value!, ok: result.ok };
            } catch (e) {
                console.error(e);
                throw new Error("at Restaurant().update()");
            }
        },
        get: async (options: FindOptions<RestaurantType> = {}): Promise<RestaurantType | null> => {
            try {
                return await client.db(mainDBName).collection("restaurants")
                    .findOne<RestaurantType>({ _id: id(restaurantId) }, options);
            } catch (error) {
                console.error(error);
                throw new Error("at Restaurant().get()");
            }
        },
        dishes: {
            one: (dishId: string | ObjectId) => {
                return {
                    get: async (options: FindOptions = {}): Promise<Dish | null> => {
                        try {
                            const result = await client.db(dishesDBName).collection(restaurantId!.toString())
                                .findOne<Dish>({ _id: id(dishId) }, options);

                            return result;
                        } catch (err) {
                            console.log(err);
                            throw new Error("at Restaurant().dishes.one().get()");
                        }
                    },
                    update: async (update: UpdateFilter<Dish>, options: UpdateOptions = {}): Promise<UpdateResult> => {
                        try {
                            const result = await client.db(dishesDBName).collection(restaurantId!.toString())
                                .updateOne({ _id: id(dishId) }, update, options);

                            return result;
                        } catch (err) {
                            console.log(err);
                            throw new Error("at Restaurant().dishes.one().update()");
                        }
                    },
                    remove: async () => {
                        try {
                            const result = await client.db(dishesDBName).collection(restaurantId!.toString())
                                .deleteOne({ _id: id(dishId) });

                            return result;
                        } catch (e) {
                            console.error(e);
                            throw new Error("at Restaurant().dishes.remove()");
                        }
                    }
                }
            },
            many: (search: Filter<Dish>) => {
                return {
                    get: async (options: FindOptions = {}): Promise<Dish[]> => {
                        try {
                            const result = await client.db(dishesDBName).collection(restaurantId!.toString())
                                .find<Dish>(search, options).toArray();

                            return result;
                        } catch (e) {
                            console.error(e);
                            throw new Error("at Restaurant().dishes.many()");
                        }
                    },
                    update: async (update: UpdateFilter<Dish>, options: UpdateOptions = {}) => {
                        try {
                            return await client.db(dishesDBName).collection<Dish>(restaurantId!.toString())
                                .updateMany(search, update, options);
                        } catch (err) {
                            console.log("AT RESTAURANT DISHES MANY UPDATE");
                            throw err;
                        }
                    },
                    bulk: async (update: AnyBulkWriteOperation<Dish>[]) => {
                        try {
                            return await client.db(dishesDBName).collection<Dish>(restaurantId!.toString()).bulkWrite(
                                update
                            );
                        } catch (err) {
                            console.log("RESTAURANT DISHES MANY BULK");
                            throw err;
                        }
                    }
                }
            },
            add: async (dish: Dish) => {
                try {
                    const result = await client.db(dishesDBName).collection(restaurantId!.toString())
                        .insertOne(dish);

                    return result;
                } catch (e) {
                    console.error(e);
                    throw new Error("at Restaurant().dishes.add()")
                }
            },
            aggregate: async (pipeline: any, options: AggregateOptions = {}) => {
                try {
                    return client.db(dishesDBName).collection(restaurantId!.toString()).aggregate(pipeline, options);
                } catch (e) {
                    throw e;
                }
            }
        },
        staff: {
            // remove: async (userId: string | ObjectId, reason: string, stars: number): Promise<null> => {
            //   if (!restaurantId) {
            //     return null;
            //   }
            //   const result1 = await client.db(db).collection("restaurants").updateOne(
            //     { _id: id(restaurantId) },
            //     { $pull: { staff: { _id: id(userId) } } }
            //   );
            //   const result2 = await updateUser(userId, {
            //     $pull: { works: { _id: id(restaurantId) } },
            //     $push: { feedbacks: { _id: id()!, restaurantId: id(restaurantId)!, comment: reason, stars, role } }
            //   });

            //   if (result1.modifiedCount > 0) {
            //     log("success", "user removed from restaurant");
            //   } else {
            //     log("checking", "user werent removed from restaurant. restaurant found: ", result1.matchedCount > 0);
            //   }
            //   if (result2.modifiedCount > 0) {
            //     log("success", "restaurant removed from user");
            //   } else {
            //     const user = await getUser(userId, { projection: { username: 1 } });
            //     if (user) {
            //       log("checking", "user exists");
            //     } else {
            //       log("checking", "user doesn't exist");
            //     }
            //   }
            //   return null;
            // },
            online: async (userId: string | ObjectId) => {
                try {
                    const result = await client.db(mainDBName).collection("restaurants")
                        .updateOne({ _id: id(restaurantId) }, { $set: { "staff.$[user].online": true } }, { arrayFilters: [{ "user._id": id(userId) }] })

                    return result;
                } catch (e) {
                    console.error(e);
                    throw new Error("at Restaurant().staff.online()");
                }
            },
            offline: async (userId: string | ObjectId) => {
                try {
                    const result = await client.db(mainDBName).collection("restaurants")
                        .updateOne({ _id: id(restaurantId) }, { $set: { "staff.$[user].online": false } }, { arrayFilters: [{ "user._id": id(userId) }] })

                    return result;
                } catch (e) {
                    console.error(e);
                    throw new Error("at Restaurant().staff.online()");
                }
            }
        },
    }
}

async function manyRestaurants(filter: Filter<RestaurantType>, options: FindOptions) {
    try {
        return client.db(mainDBName).collection<RestaurantType>("restaurants").find(filter, options).toArray();
    } catch (e) {
        console.log("at manyRestaurants()");
        throw e
    }
}

export {
    Restaurant,
    manyRestaurants,
}