import { ObjectId } from "mongodb";
import { Subject } from "rxjs";
import { Socket } from "socket.io";
import { general } from "../../../assets/consts";
import { ManagerSettings, Order, StatisticsOrder } from "../../../models/components";
import { Dish } from "../../../models/general";
import { KitchenDish } from "../../../models/other";
import { KitchenResponse } from "../../../models/responses";
import { createNotificationData } from "../../../utils/client";
import { getDishes } from "../../../utils/dish";
import { id, log } from "../../../utils/functions";
import { getDelay } from "../../../utils/other";
import { Orders, Restaurant, Stats } from "../../../utils/restaurant";

class Session {

    userId!: ObjectId;
    restaurantId!: ObjectId;

    constructor(userId: string, restaurantId: string) {
        if (userId.length != 24 || restaurantId.length != 24) {
            return;
        }
        this.userId = id(userId)!;
        this.restaurantId = id(restaurantId)!;
    }

    async takeDish(orderId: string, orderDishId: string) {
        const update1 = await Orders(this.restaurantId).one(orderId).update({ $set: { "orders.$[order].dishes.$[dish].taken": { time: Date.now(), userId: this.userId } } }, { arrayFilters: [ { "dish._id": id(orderDishId) } ] })

        if (update1.modifiedCount > 0) {
            log("success", "dish has been taken");
        } else {
            log("failed", "taking dish");
        }

        return update1.modifiedCount > 0;
    }

    async doneDish({ orderDishId, orderId, dishId }: { dishId: string; orderId: string, orderDishId: string }) {
        const update1 = await Orders(this.restaurantId).one(orderId).update({ $pull: { "orders.$[order].dishes": { _id: id(orderDishId) } } });
        const update2 = await Stats(this.restaurantId).order(orderId).updateDishStatus(orderDishId, 2, this.userId);

        const order = await Orders(this.restaurantId).one(orderId).get();

        const update3 = await Restaurant(this.restaurantId).waiter.dishServe(orderId, orderDishId);

        console.log("removing dish from order: ", update1.modifiedCount > 0);
        console.log("updating dish status: ", update2.modifiedCount > 0);
        console.log("adding dish to waiters: ", update3.modifiedCount > 0);

        if(update1.modifiedCount == 0) {
            log("error", "AT DONEDISH");
            return null;
        }

        if(order.dishes?.length == 0) {
            const statsOrder = await Stats(this.restaurantId).order(orderId).get();
            const status = await getOrderStatus(statsOrder, true);


            const update4 = await Stats(this.restaurantId).order(orderId).updateStatus(status);
            const update5 = await Orders(this.restaurantId).one(orderId).remove();
            console.log("updating status: ", update4.modifiedCount > 0)
            console.log("removing order: ", update5.modifiedCount > 0);
        }
        
        const dish = await Restaurant(this.restaurantId).dishes.one(dishId).get({ projection: { cooking: { components: 1 } } });

        for(let i of dish?.cooking?.components!) {
            Restaurant(this.restaurantId).components.substract(i._id, i.amount);
        }

        return null;
    }



}

async function getOrderStatus(order: StatisticsOrder | null, done: boolean) {
    if(!order) {
        return 5;
    }

    let status = 2;

    for(let i of order.dishes!) {
        if(i.status > 2) {
            status = 2;
            if(done) {
                status = 32;
            }
        }
    }

    return status;
}
async function allowed(userId: string, restaurantId: string) {

    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { role: 1, settings: 1, _id: 1 } } });

    for (let { role, _id, settings } of restaurant?.staff!) {
        if (_id.toString() == userId) {
            if (role == "cook" || (role == "manager" && (settings as ManagerSettings).work.cook)) {
                return true;
            }
        }
    }

    return false;
}
async function sortDishesForKitchen(restaurantId: string | ObjectId, orders: Order[]) {

    const finalDishes: KitchenDish[] = [];
    let convertedDishes = {};

    const now = Date.now();


    if(orders.length == 0) {
        return {
            categories: () => {
                return {
                    a: [],
                    so: [],
                    sa: [],
                    e: [],
                    si: [],
                    d: [],
                    b: []
                }
            },
            convertedDishes,
            dishes: []
        };
    }

    for(let order of orders) {

        const orderDishesIdsConvert = () => {
            const result = new Set;
            for(let i of order.dishes!) {
                result.add(i.dishId);
            }
            return Array.from(result);
        }

        const dishIds = orderDishesIdsConvert();

        const dishes = await getDishes(restaurantId.toString(), { _id: { $in: dishIds } }, { projection: { name: 1, general: 1, image: 1, time: 1 } });
        const newConvertedDishes: { [key: string]: Dish } = {};

        for(let i of dishes) {
            newConvertedDishes[i._id.toString()] = i;
        }

        for (let dish of order.dishes!) {
            const getType = () => {
                for(let i of general) {
                    if(i.value == newConvertedDishes[dish.dishId.toString()].general) {
                        return i;
                    }
                }
                return null;
            }
            const finalDish: KitchenDish = {
                dishId: dish.dishId,
                _id: dish._id,
                time: getDelay(order.time!),
                type: getType(),
                orderId: order._id!,
                taken: !!dish.taken,
                takenTime: getDelay(dish.taken?.time!).title
            }
            if(dish.taken?.time! > now) {
                finalDishes.push(finalDish);
            } else {
                finalDishes.unshift(finalDish);
            }
        }

        convertedDishes = Object.assign(convertedDishes, newConvertedDishes);
    }


    return {
        dishes: finalDishes,
        convertedDishes,
        categories: () => {
            const result: any = {
                a: [],
                so: [],
                sa: [],
                e: [],
                si: [],
                d: [],
                b: []
            };

            for(let i of finalDishes) {
                result[i.type!.value][i.taken ? "push" : "unshift"](i);
            }

            return result;
        }
    };
}
function sortQuantity(dishes: string[]) {
    const result = [] as { dishId: string; quantity: number }[];

    for(let i of dishes) {
        let add = true;
        for(let j of result) {
            if(i == j.dishId) {
                j.quantity++;
                add = false;
                break;
            }
        }
        if(add) {
            result.push({ dishId: i, quantity: 1 });
        }
    }

    return {
        result: result,
        ids: (function() {
            const ids: ObjectId[] = [];

            for(let i of result) {
                ids.push(id(i.dishId)!);
            }

            return ids;
        })()
    };
}

function KitchenSocket(socket: Socket) {
    const subs = new Subject<KitchenResponse>();

    let session: Session;

    socket.on("kitchenConnect", ({ restaurantId, userId }: { restaurantId: string; userId: string; }) => {
        if (!allowed(userId, restaurantId)) {
            socket.disconnect();
            return null;
        }

        session = new Session(userId, restaurantId);

        socket.join(`${restaurantId}/kitchen`);
    });

    socket.on("kitchen/dish/take", async data => {
        if (!session) {
            return;
        }

        const { orderId, orderDishId } = data;

        const result = await session.takeDish(orderId, orderDishId);

        if (result) {
            subs.next({
                type: "kitchen/dish/take",
                data: {
                    orderDishId
                },
                send: [`${session.restaurantId.toString()}/restaurant`]
            });
        } else {
            log("error", "something went wrong kitchen/dish/take");
        }
    });

    socket.on("kitchen/dish/done", async data => {
        if(!session) {
            return;
        }

        const { dishId, orderId } = (data);

        session.doneDish(data);

        const notification = await createNotificationData(dishId, orderId, session.restaurantId);

        if(notification) {
            subs.next({
                type: "customer/notification",
                event: "client",
                ...notification,
            });
        }

    })

    socket.on("disconnect", () => {
        session = null!;
    });

    return subs;
}

export {
    KitchenSocket,
    sortDishesForKitchen,
    sortQuantity
}