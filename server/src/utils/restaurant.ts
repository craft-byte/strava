import { AggregateOptions, AnyBulkWriteOperation, Filter, FindOptions, ObjectId, UpdateFilter, UpdateOptions, UpdateResult } from "mongodb";
import { client } from "..";
import { db } from "../environments/server";
import { Component, Order, Session, StatisticsOrder, WaiterOrder } from "../models/components";
import { Dish, Restaurant, Work } from "../models/general";
import { id, log } from "./functions";
import { getUser, updateUser } from "./users";



function Restaurant(restaurantId?: string | ObjectId) {
  return {
    remove: async () => {
      try {
        const restaurant = await Restaurant(restaurantId).get({ projection: { staff: 1, owner: 1, invitations: 1 } });

        if (!restaurant) {
          return null;
        }

        for (let i of restaurant.staff!) {
          const result = await updateUser(i._id, { $pull: { works: id(restaurantId) } });

          console.log("user works deleted: ", result.modifiedCount > 0);
        }

        for (let i of restaurant.invitations!) {
          const result = await updateUser(i._id, { $pull: { invitations: { _id: id(i._id) } } });

          console.log("user invitation deleted: ", result.modifiedCount > 0);
        }

        const result1 = await updateUser(restaurant.owner!, { $pull: { restaurants: id(restaurantId) } });

        console.log("owner restaurant removed: ", result1.modifiedCount > 0);


        const result2 = await client.db(db).collection("restaurants").deleteOne({ _id: id(restaurantId) });

        console.log("restaurant deleted: ", result2.deletedCount > 0);

        const result3 = await client.db(db).collection("work").deleteOne({ restaurant: id(restaurantId) });

        console.log("work removed: ", result3.deletedCount > 0);

        const result4 = await client.db(db).dropCollection(restaurantId!.toString());

        console.log("collection removed: ", result4);

        return result1.modifiedCount > 0 && result2.deletedCount > 0 && result4 && result3.deletedCount > 0;

      } catch (e) {
        throw e;
      }
    },
    aggregate: async <T>(pipeline: any[]): Promise<T[]> => {
      try {
        return await client.db(db).collection("restaurants")
          .aggregate<T>(pipeline).toArray();
      } catch (e) {
        console.error(e);
        throw new Error("at aggregateRestaurant()");
      }
    },
    search: async (search: any, options: any = {}): Promise<Restaurant[]> => {
      try {
        return await client.db(db).collection("restaurants")
          .find<Restaurant>(search, options).toArray();
      } catch (err) {
        console.error(err);
        throw new Error("at getRestaurants()");
      }
    },
    update: async (update: UpdateFilter<Restaurant>, options: UpdateOptions = {}): Promise<UpdateResult | null> => {
      if (!restaurantId) {
        return null;
      }
      try {
        return await client.db(db).collection("restaurants")
          .updateOne({ _id: id(restaurantId) }, update, options);
      } catch (e) {
        console.error(e);
        throw new Error("at Restaurant().update()");
      }
    },
    get: async (options: FindOptions<Restaurant> = {}): Promise<Restaurant | null> => {
      try {
        return await client.db(db).collection("restaurants")
          .findOne<Restaurant>({ _id: id(restaurantId) }, options);
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
              const result = await client.db(db).collection(restaurantId!.toString())
                .findOne<Dish>({ _id: id(dishId) }, options);

              return result;
            } catch (err) {
              console.log(err);
              throw new Error("at Restaurant().dishes.one().get()");
            }
          },
          update: async (update: UpdateFilter<Dish>, options: UpdateOptions = {}): Promise<UpdateResult> => {
            try {
              const result = await client.db(db).collection(restaurantId!.toString())
                .updateOne({ _id: id(dishId) }, update, options);

              return result;
            } catch (err) {
              console.log(err);
              throw new Error("at Restaurant().dishes.one().update()");
            }
          },
          remove: async () => {
            try {
              const result = await client.db(db).collection(restaurantId!.toString())
                .deleteOne({ _id: id(dishId) });

              return result;
            } catch (e) {
              console.error(e);
              throw new Error("at Restaurant().dishes.remove()");
            }
          }
        }
      },
      many: (search: any) => {
        return {
          get: async (options: FindOptions = {}): Promise<Dish[]> => {
            try {
              const result = await client.db(db).collection(restaurantId!.toString())
                .find<Dish>(search, options).toArray();

              return result;
            } catch (e) {
              console.error(e);
              throw new Error("at Restaurant().dishes.many()");
            }
          },
          update: async (update: UpdateFilter<Dish>, options: UpdateOptions = {}) => {
            try {
              return await client.db(db).collection<Dish>(restaurantId!.toString())
                .updateMany(search, update, options);
            } catch (err) {
              console.log("AT RESTAURANT DISHES MANY UPDATE");
              throw err;
            }
          },
          bulk: async (update: AnyBulkWriteOperation<Dish>[]) => {
            try {
              return await client.db(db).collection<Dish>(restaurantId!.toString()).bulkWrite(
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
          const result = await client.db(db).collection(restaurantId!.toString())
            .insertOne(dish);

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().dishes.add()")
        }
      },
      aggregate: async (pipeline: any, options: AggregateOptions = {}) => {
        try {
          return client.db(db).collection(restaurantId!.toString()).aggregate(pipeline, options);
        } catch (e) {
          throw e;
        }
      }
    },
    components: {
      getAll: async (projection?: any): Promise<Component[]> => {
        try {
          const result = await client.db(db).collection("restaurants").findOne<Restaurant>({ _id: id(restaurantId) }, { projection: { components: projection } });

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
        const result = await client.db(db).collection("restaurants").updateOne(
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
          const result = await client.db(db).collection("restaurants").aggregate([
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
      remove: async (userId: string | ObjectId, reason: string, stars: number): Promise<null> => {
        if (!restaurantId) {
          return null;
        }
        const result1 = await client.db(db).collection("restaurants").updateOne(
          { _id: id(restaurantId) },
          { $pull: { staff: { _id: id(userId) } } }
        );
        const result2 = await updateUser(userId, {
          $pull: { works: { _id: id(restaurantId) } },
          $push: { feedbacks: { _id: id(), restaurantId: id(restaurantId), reason, rating: stars } }
        });

        if (result1.modifiedCount > 0) {
          log("success", "user removed from restaurant");
        } else {
          log("checking", "user werent removed from restaurant. restaurant found: ", result1.matchedCount > 0);
        }
        if (result2.modifiedCount > 0) {
          log("success", "restaurant removed from user");
        } else {
          const user = await getUser(userId, { projection: { username: 1 } });
          if (user) {
            log("checking", "user exists");
          } else {
            log("checking", "user doesn't exist");
          }
        }
        return null;
      },
      online: async (userId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("restaurants")
            .updateOne({ _id: id(restaurantId) }, { $set: { "staff.$[user].online": true } }, { arrayFilters: [{ "user._id": id(userId) }] })

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().staff.online()");
        }
      },
      offline: async (userId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("restaurants")
            .updateOne({ _id: id(restaurantId) }, { $set: { "staff.$[user].online": false } }, { arrayFilters: [{ "user._id": id(userId) }] })

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().staff.online()");
        }
      }
    },
    waiter: {
      getAll: async () => {
        try {
          const result = await client.db(db).collection("work")
            .findOne({ restaurant: id(restaurantId) }, { projection: { waiter: 1 } });

          return (result as any).waiter as WaiterOrder[];
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().waiter.getAll()");
        }
      },
      remove: async (orderId: string | ObjectId, orderDishId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("work")
            .updateOne(
              { restaurant: id(restaurantId) },
              { $pull: { "waiter.$[order].dishes": { _id: id(orderDishId) } } },
              { arrayFilters: [{ "order._id": id(orderId) }] }
            );

          console.log(result);

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().waiter.remove()");
        }
      },
      // add: async (orderId: string | ObjectId, dish: any) => {
      //     try {
      //         const result = await client.db(db).collection("work")
      //             .updateOne({ restaurant: id(restaurantId) }, { $push: { "waiter.$[order].dishes": dish } }, { arrayFilters: [ { "order._id": id(orderId) } ] });

      //         return result;
      //     } catch (e) {
      //         console.error(e);
      //         throw new Error("at Restaurant().waiter.add()");
      //     }
      // },
      get: async (orderId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("work")
            .aggregate([
              { $match: { restaurant: id(restaurantId) } },
              { $unwind: "$waiter" },
              { $match: { "waiter._id": id(orderId) } }
            ]).toArray();

          if (result.length == 0 || !result[0]) {
            return null;
          }

          return result[0].waiter as WaiterOrder;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().waiter.get()");
        }
      },
      dishServe: async (orderId: string | ObjectId, orderDishId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("work")
            .updateOne(
              { restaurant: id(restaurantId) },
              {
                $set: {
                  "waiter.$[order].dishes.$[dish].show": true,
                  "waiter.$[order].dishes.$[dish].time": Date.now()
                }
              },
              { arrayFilters: [{ "order._id": id(orderId) }, { "dish._id": id(orderDishId) }] }
            );

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().waiter.dishServe()");
        }
      },
      removeOrder: async (orderId: string | ObjectId) => {
        try {
          const result = await client.db(db).collection("work")
            .updateOne(
              { restaurant: id(restaurantId) },
              { $pull: { waiter: { _id: id(orderId) } } }
            );

          return result;
        } catch (e) {
          console.error(e);
          throw new Error("at Restaurant().waiter.removeOrder()");
        }
      }
    },
    sessions: {
      create: async (session: Session) => {
        try {
          return await client.db(db).collection("restaurants")
            .updateOne({ _id: id(restaurantId) }, [
              {
                $set: {
                  sessions: {
                    $cond: [
                      {
                        $in: [
                          id(session.userId),
                          "$sessions.userId"
                        ]
                      },
                      {
                        $map: {
                          input: "$sessions",
                          as: "session",
                          in: {
                            $cond: [
                              {
                                $eq: [
                                  "$$session.userId",
                                  id(session.userId)
                                ]
                              },
                              {
                                $mergeObjects: [
                                  "$$session",
                                  {
                                    date: new Date(),
                                    type: session.type,
                                    number: session.number
                                  }
                                ]
                              },
                              "$$session"
                            ]
                          }
                        }
                      },
                      {
                        $concatArrays: [
                          "$sessions",
                          [
                            session
                          ]
                        ]
                      }
                    ]
                  }
                }
              }
            ]);
        } catch (e) {
          throw e;
        }
      },
      userId: (userId: string | ObjectId) => {
        return {
          get: async () => {
            try {
              const result = await client.db(db).collection("restaurants")
                .aggregate([
                  { $match: { _id: id(restaurantId) } },
                  { $unwind: "$sessions" },
                  { $match: { "sessions.userId": id(userId) } },
                ]).toArray();

              return result[0] as Session || null;
            } catch (e) {
              throw e;
            }
          }
        }
      },
      sessionId: (sessionId: string | ObjectId) => {
        return {
          get: async () => {
            try {
              const result = await client.db(db).collection("restaurants")
                .aggregate([
                  { $match: { _id: id(restaurantId) } },
                  { $unwind: "$sessions" },
                  { $match: { "sessions._id": id(sessionId) } },
                ]).toArray();

              return result[0] as Session || null;
            } catch (e) {
              throw e;
            }
          },
          remove: async () => {
            try {
              return await client.db(db).collection("restaurants")
                .updateOne({ _id: id(restaurantId) }, { $pull: { sessions: { _id: id(sessionId) } } });
            } catch (e) {
              throw e;
            }
          }
        }
      }
    }
  }
}


function Orders(restaurantId: string | ObjectId) {
  return {
    all: async (projection?: any) => {
      try {
        const result = await client.db(db).collection("work")
          .findOne<Work>({ restaurant: id(restaurantId) }, { projection: { orders: projection ? projection : 1 } });

        return result?.orders!;
      } catch (err) {
        console.error(err);
        throw new Error("at Orders().all()");
      }
    },
    aggregate: async (pipeline: any) => {
      try {
        const result = await client.db(db).collection("work").aggregate([
          { $match: { restaurant: id(restaurantId) } },
          ...pipeline,
        ]).toArray();

        return result;
      } catch (e) {
        throw e;
      }
    },
    create: async (
      userId: string | ObjectId,
      socketId: string,
      info: { type: "order" | "table", number: number; },
      dishes: any[]
    ) => {
      try {
        const convertDishes = () => {
          const stats = [];
          const waiter = [];

          // STATUS
          // 1-ok
          // 2-done
          // 3-warning
          //   31-unliked
          // 4-removed
          //   41-components
          //   42-user
          //   43-admin

          for (let i of dishes) {
            waiter.push({
              ...i,
              show: false,
            });
            stats.push({
              ...i,
              status: 1
            })
          }
          return { order: dishes, stats, waiter };
        }

        const { order: forOrder, stats, waiter: waiterDishes } = convertDishes();
        const _id = id()!;
        const userObjectId = id(userId)!;
        const time = new Date().getTime();

        const order: Order = {
          _id,
          dishes: forOrder,
          userId: userObjectId,
          socketId,
          time,
          ...info
        };
        const waiter = {
          _id,
          dishes: waiterDishes,
          userId: userObjectId,
          socketId,
          ...info
        };
        const statistics: StatisticsOrder = {
          // STATUS
          // 1-in procces
          // 2-done
          // 3-warning
          //   31-done+warning
          // 4-removed
          //   41-user
          //   42-admin
          // 5-something wrong
          _id,
          status: 1,
          dishes: stats,
          userId: userObjectId,
          ...info,
          time
        }

        const req = await client.db(db).collection("work")
          .updateOne(
            { restaurant: id(restaurantId) },
            { $push: { orders: order, waiter } }
          );
        const req2 = await client.db(db).collection("work")
          .updateOne(
            { restaurant: id(restaurantId) },
            { $push: { statistics: statistics } }
          );

        console.log("ORDER CREATED: ", req.modifiedCount > 0);
        console.log("STATISTICS CREATED: ", req2.modifiedCount > 0);

        return order;
      } catch (e) {
        console.error(e);
        throw new Error("ar Orders().create()");
      }
    },
    updateIds: async (userId: string | ObjectId, socketId: string) => {
      try {
        const result = await client.db(db).collection("work")
          .updateOne(
            { restaurant: id(restaurantId) },
            { $set: { "orders.$[user].socketId": socketId } },
            { arrayFilters: [{ "user.userId": id(userId) }] }
          );

        return result;
      } catch (e) {
        console.error(e);
        throw new Error("at Orders().updateIds()");
      }
    },
    one: (orderId: string | ObjectId) => {
      return {
        get: async (): Promise<Order> => {
          try {
            const result = await client.db(db).collection("work")
              .aggregate([
                { $match: { restaurant: id(restaurantId) } },
                { $unwind: "$orders" },
                { $match: { "orders._id": id(orderId) } },
                { $project: { order: "$orders" } }
              ]).toArray();

            if (result.length == 0 || !result[0]) {
              return null!;
            }
            return result[0].order;
          } catch (err) {
            console.error(err);
            throw new Error("at Orders.one().get()");
          }
        },
        update: async (update: any, options: UpdateOptions = {}): Promise<UpdateResult> => {
          try {

            let arrayFilters: any = [{ "order._id": id(orderId) }];

            if (options && options.arrayFilters) {
              arrayFilters = arrayFilters.concat(options.arrayFilters);
              delete options.arrayFilters;
            }

            const result = await client.db(db).collection("work")
              .updateOne(
                { restaurant: id(restaurantId) },
                update,
                { arrayFilters, ...options }
              );

            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Orders().one().update");
          }
        },
        remove: async () => {
          try {
            const result = await client.db(db).collection("work")
              .updateOne(
                { restaurant: id(restaurantId) },
                { $pull: { orders: { _id: id(orderId) } } }
              );

            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Orders().one().remove()");
          }
        }
      }
    },
  };
}

function Stats(restaurantId: string | ObjectId) {
  return {
    aggregate: async (pipeline: any[]) => {
      try {
        return await client.db(db).collection("work").aggregate([
          { $match: { restaurant: id(restaurantId) } },
          ...pipeline
        ]).toArray();
      } catch (err) {
        console.log("AT STATS.aggregate");
        throw err;
      }
    },
    getMany: async (limit: number) => {
      try {
        const result = await client.db(db).collection("work")
          .findOne({
            restaurant: id(restaurantId),
          },
            { projection: { statistics: { $slice: limit } } });

        if (!result) {
          return null;
        }

        return result.statistics as StatisticsOrder[];
      } catch (e) {
        console.error(e);
        throw new Error("at Stats().getMany()");
      }
    },
    order: (orderId: string | ObjectId) => {
      return {
        updateStatus: async (status: number) => {
          try {
            const result = await client.db(db).collection("work")
              .updateOne(
                { restaurant: id(restaurantId) },
                { $set: { "statistics.$[order].status": status } },
                { arrayFilters: [{ "order._id": id(orderId) }] }
              );

            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Stats().order().updateStatus()");
          }
        },
        get: async (): Promise<StatisticsOrder | null> => {
          try {
            const result = await client.db(db).collection("work")
              .aggregate([
                { $match: { restaurant: id(restaurantId) } },
                { $unwind: "$statistics" },
                { $match: { "statistics._id": id(orderId) } }
              ]).toArray();

            if (result.length == 0 || !result[0]) {
              return null;
            }

            return result[0].statistics;
          } catch (e) {
            console.error(e);
            throw new Error("at Stats().order().get()");
          }
        },
        updateDishStatus: async (dishId: string | ObjectId, status: number, userId: ObjectId | string) => {
          try {
            const result = await client.db(db).collection("work")
              .updateOne(
                { restaurant: id(restaurantId) },
                { $set: { "statistics.$[order].dishes.$[dish].status": status, "statistics.$[order].dishes.$[dish].cook": id(userId) } },
                { arrayFilters: [{ "order._id": id(orderId) }, { "dish._id": id(dishId) }] }
              );

            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Stats().order().updateDish()");
          }
        },
        setWaiter: async (orderDishId: string | ObjectId, userId: string | ObjectId) => {
          try {
            const result = await client.db(db).collection("work")
              .updateOne(
                { restaurant: id(restaurantId) },
                { $set: { "statistics.$[order].dishes.$[dish].waiter": userId } },
                { arrayFilters: [{ "order._id": id(orderId) }, { "dish._id": id(orderDishId) }] }
              );

            return result;
          } catch (e) {
            console.error(e);
            throw new Error("at Stats().order().setWaiter()");
          }
        }
      }
    }
  }
}


export {
  Restaurant,
  Orders,
  Stats
}