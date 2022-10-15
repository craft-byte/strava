import { AggregateOptions, AnyBulkWriteOperation, Filter, FindOneAndUpdateOptions, FindOptions, ModifyResult, ObjectId, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { resourceLimits } from "worker_threads";
import { client } from "..";
import { dishesDBName, historyDBName, mainDBName, ordersDBName } from "../environments/server";
import { Component, Id } from "../models/components";
import { Dish, Restaurant as RestaurantType, Order } from "../models/general";
import { id } from "./functions";
import { updateUser } from "./users";



function Restaurant(restaurantId?: string | ObjectId) {
  return {
    remove: async () => {
      try {
        const restaurant = await Restaurant(restaurantId).get({ projection: { staff: 1, owner: 1, invitations: 1 } });

        if (!restaurant) {
          return null;
        }

        for (let i of restaurant.staff!) {
          const result = await updateUser({ _id: id(i.userId) }, { $pull: { works: id(restaurantId)!, restaurants: { restaurantId: id(restaurantId)! } } });

          console.log("user works deleted: ", result.ok == 1);
        }

        for (let i of restaurant.invitations!) {
          const result = await updateUser(i._id, { $pull: { invitations: { _id: id(i._id) } } });

          console.log("user invitation deleted: ", result.ok == 1);
        }

        const result1 = await updateUser({ _id: (restaurant.owner!) }, { $pull: { restaurants: { restaurantId: id(restaurantId)! } } });

        console.log("owner restaurant removed: ", result1.ok == 1);


        const result2 = await client.db(mainDBName).collection("restaurants").deleteOne({ _id: id(restaurantId) });

        console.log("restaurant deleted: ", result2.deletedCount > 0);

        
        
        const result3 = await client.db(ordersDBName).dropCollection(restaurantId!.toString());
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
    aggregate: async <T>(pipeline: any[]): Promise<T[]> => {
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
    update: async (update: UpdateFilter<RestaurantType>, options: FindOneAndUpdateOptions = { }): Promise<{ restaurant: RestaurantType; ok: 1 | 0 }> => {
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
    components: {
      getAll: async (projection?: any): Promise<Component[]> => {
        try {
          const result = await client.db(mainDBName).collection("restaurants").findOne<RestaurantType>({ _id: id(restaurantId) }, { projection: { components: projection } });

          return result?.components!;
        } catch (err) {
          console.log(err);
          throw new Error("at Restaurant().components.getAll()");
        }
      },
      substract: async (componentId: string | ObjectId, amount: number): Promise<UpdateResult | null> => {
        if (!restaurantId) {
          return null;
        }
        const result = await client.db(mainDBName).collection("restaurants").updateOne(
          { _id: id(restaurantId) },
          { $inc: { "components.$[component].amount": amount } },
          {
            arrayFilters: [{ "component._id": id(componentId) }]
          }
        );

        return result;
      },
      getMany: async (ids: ObjectId[], projection?: any) => {
        try {
          const result = await client.db(mainDBName).collection("restaurants").aggregate([
            { $match: { _id: id(restaurantId) } },
            { $unwind: "$components" },
            { $match: { "components._id": { $in: ids } } },
            {
              $group: {
                _id: "$_id",
                components: {
                  $push: "$components"
                }
              }
            },
            { $project: { components: projection || { name: 1, _id: 1 } } }
          ]).toArray();

          if (result.length == 0 || !result[0]) {
            return null;
          }

          return (result as any)[0].components as Component[];
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().components.getMany()");
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


function Orders(restaurantId: string | ObjectId) {
  return {
    update: async (search: Filter<Order>, update: UpdateFilter<Order>, options: UpdateOptions = {}) => {                 /////// check
      try {
        return await client.db(ordersDBName).collection<Order>(restaurantId.toString())
          .updateMany(search, update, options);
      } catch (e) {
        console.error("at Orders().update()");
        throw e;
      }
    },
    deleteMany: async (search: Filter<Order>) => {
      try {
        return await client.db(ordersDBName).collection(restaurantId.toString()).deleteMany(search);
      } catch (e) {
        console.error("at Orders().deleteMany()");
        throw e;
      }
    },
    aggregate: async (pipeline: any) => {
      try {
        const result = await client.db(ordersDBName).collection(restaurantId.toString()).aggregate(pipeline).toArray();

        return result;
      } catch (e) {
        throw e;
      }
    },
    createSession: async (session: Order) => {
      try {
        const exists = await client.db(ordersDBName).collection(restaurantId!.toString())
          .findOne({ customer: session.customer, status: "ordering" }, { projection: { _id: 1, type: 1 } });

        if(exists) {
          const result = await client.db(ordersDBName).collection(restaurantId!.toString())
            .updateOne({ customer: session.customer, status: "ordering" }, { $set: { socketId: session.socketId, connected: session.connected, id: session.id, type: session.type } });

          return result.modifiedCount > 0;
        } else {
          const result = await client.db(ordersDBName).collection(restaurantId!.toString())
            .insertOne(session);
          
          return result.acknowledged;
        }
      } catch (e) {
        throw e;
      }
    },

    many: async (search: Filter<Order>, options?: FindOptions<Order>) => {
      try {
        const result = await client.db(ordersDBName).collection<Order>(restaurantId.toString())
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
            const result = await client.db(ordersDBName).collection(restaurantId.toString())
              .findOne<Order>(search, options);

            return result as any;
          } catch (err) {
            console.error(err);
            throw new Error("at Orders.one().get()");
          }
        },
        update: async (update: UpdateFilter<Order>, options: FindOneAndUpdateOptions = {}): Promise<{ order: Order; ok: 1 | 0 }> => {
          try {
            const result = await client.db(ordersDBName).collection<Order>(restaurantId.toString())
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
            const result = await client.db(ordersDBName).collection<Order>(restaurantId.toString())
              .findOneAndDelete(search);
            
            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Orders().one().remove()");
          }
        }
      }
    },
    history: {
      insert: async (order: Order) => {
        try {
          return await client.db(historyDBName).collection<Order>(restaurantId.toString()).insertOne(order);
        } catch (e) {
          console.error("at Orders.hisotry.insert()")
          throw e;
        }
      },
      many: async (search: Filter<Order>, options?: FindOptions<Order>) => {
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


async function manyRestaurants(filter: Filter<RestaurantType>, options: FindOptions) {
  try {
    return client.db(mainDBName).collection("restaurants").find(filter, options).toArray();
  } catch (e) {
    console.log("at manyRestaurants()");
    throw e
  }
}

export {
  Restaurant,
  Orders,
  manyRestaurants,
}