import { Filter, FindOneAndUpdateOptions, FindOptions, ObjectId, UpdateFilter, UpdateOptions } from "mongodb";
import { client } from "..";
import { historyDBName, sessionsDBName } from "../environments/server";
import { Order } from "../models/Order";
import { Restaurant } from "./restaurant";

export function Orders(restaurantId: string | ObjectId) {
    return {
        update: async (search: Filter<Order>, update: UpdateFilter<Order>, options: UpdateOptions = {}) => {
            try {
                return await client.db(sessionsDBName).collection<Order>(restaurantId.toString())
                    .updateMany(search, update, options);
            } catch (e) {
                console.error("at Orders().update()");
                throw e;
            }
        },
        deleteMany: async (search: Filter<Order>) => {
            try {
                return await client.db(sessionsDBName).collection(restaurantId.toString()).deleteMany(search);
            } catch (e) {
                console.error("at Orders().deleteMany()");
                throw e;
            }
        },
        aggregate: async (pipeline: any) => {
            try {
                const result = await client.db(sessionsDBName).collection(restaurantId.toString()).aggregate(pipeline).toArray();

                return result;
            } catch (e) {
                throw e;
            }
        },
        createSession: async (session: Order) => {
            try {
                const result = await client.db(sessionsDBName).collection(restaurantId!.toString())
                        .insertOne({
                            ...session,
                        });

                    return result.acknowledged;
            } catch (e) {
                throw e;
            }
        },

        many: async (search: Filter<Order>, options?: FindOptions<Order>) => {
            try {
                const result = await client.db(sessionsDBName).collection<Order>(restaurantId.toString())
                    .find<Order>(search, options).toArray();

                return result;
            } catch (err) {
                console.error("at Orders().all()");
                throw err;
            }
        },
        one: (search: Filter<Order>) => {
            return {
                get: async (options: FindOptions<Order> = {}): Promise<Order> => {
                    try {
                        const result = await client.db(sessionsDBName).collection(restaurantId.toString())
                            .findOne<Order>(search, options);

                        return result as any;
                    } catch (err) {
                        console.error(err);
                        throw new Error("at Orders.one().get()");
                    }
                },
                update: async (update: UpdateFilter<Order>, options: FindOneAndUpdateOptions = {}): Promise<{ order: Order; ok: 1 | 0; }> => {
                    try {
                        const result = await client.db(sessionsDBName).collection<Order>(restaurantId.toString())
                            .findOneAndUpdate(
                                search,
                                update,
                                { returnDocument: "after", ...options }
                            );

                        return { order: result.value as any, ok: result.ok };
                    } catch (e) {
                        console.error(e);
                        throw new Error("at Orders().one().update");
                    }
                },
                remove: async () => {
                    try {
                        const result = await client.db(sessionsDBName).collection<Order>(restaurantId.toString())
                            .findOneAndDelete(search);

                        return result;
                    } catch (e) {
                        console.error(e);
                        throw new Error("at Orders().one().remove()");
                    }
                }
            };
        },
        history: {
            insert: async (order: Order) => {
                try {
                    return await client.db(historyDBName).collection<Order>(restaurantId.toString()).insertOne(order);
                } catch (e) {
                    console.error("at Orders.hisotry.insert()");
                    throw e;
                }
            },
            many: (search: Filter<Order>, options?: FindOptions<Order>) => {
                try {
                    const result = client.db(historyDBName).collection<Order>(restaurantId.toString())
                        .find<Order>(search, options);

                    return result;
                } catch (err) {
                    console.error("at Orders().all()");
                    throw err;
                }
            },
            one: async (search: Filter<Order>, options: FindOptions<Order> = {}): Promise<Order> => {
                try {
                    const result = await client.db(historyDBName).collection(restaurantId.toString())
                        .findOne<Order>(search, options);

                    return result as any;
                } catch (err) {
                    console.error(err);
                    throw new Error("at Orders.one().get()");
                }
            },
        }
    };
}