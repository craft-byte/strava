import { Router } from "express";
import { allowed } from "../middleware/restaurant";
import { Restaurant } from "../utils/restaurant";
import { ComponentsRouter } from "./restaurant/components";
import { StaffRouter } from "./restaurant/staff";
import { DishesRouter } from "./restaurant/dishes";
import { UpdateRouter } from "./restaurant/update";
import { getUser, getUsers } from "../utils/users";
import { logged } from "../middleware/user";


const router = Router({ mergeParams: true });



// router.get("/", async (req, res) => {
//     const { restaurantId } = req.params as any;

//     const result = await Restaurant(restaurantId).get({ projection: {
//         name: 1,
//         _id: 1
//     } });

//     res.send(result);
// });

// router.get("/restaurants", async (req, res) => {
    
//     const user = await getUser(req.user as string, { projection: { restaurants: 1 } });

//     if(!user) {
//         return res.send({ error: "user" });
//     }

//     const { restaurants } = user;

//     const result = await Restaurant().search({ _id: { $in: restaurants } }, { projection: { name: 1 } });

//     res.send(result);
// });
// router.get("/settings", allowed("manager", "restaurant"), async (req, res) => {
//     const { restaurantId } = req.params as any;

//     const result = await Restaurant(restaurantId).get({ projection: { settings: 1, owner: 1 } });

//     if(!result || !result.settings) {
//         return res.sendStatus(404);
//     }

//     (result.settings as any).showDanger = result.owner!.equals(req.user as string);

//     res.send(result.settings);
// });
// router.delete("/", allowed("owner"), async (req, res) => {
//     const { restaurantId } = req.params;

//     const result = await Restaurant(restaurantId).remove();

//     console.log("RESTAURANT DELETED: ", result);

//     res.send({ removed: result })
// });


// router.patch("/settings", allowed("manager", "restaurant"), async (req, res) => {
//     const { restaurantId } = req.params as any;
//     const { f1, f2, value } = req.body;

//     const update: any = { $set: {} };

//     update["$set"][`settings.${f1}.${f2}`] = value;
    
    
//     const result = await Restaurant(restaurantId).update(update);

//     console.log("settings updated: ", result!.modifiedCount > 0);

//     res.send({ updated: result!.modifiedCount > 0 });
// });
// router.patch("/user", async (req, res) => {
//     const { username } = req.body;

//     const found = await byUsername(
//         username,
//         { projection: {
//             username: 1,
//             avatar: 1,
//             name: 1,
//             feedbacks: 1,
//         } }
//     ); 

//     if(!found) {
//         return res.send(null);
//     }

//     const rating = await convertFeedbacks(found.feedbacks!);

//     let feedbacks = null;
//     let avg = null;

//     if(rating) {
//         feedbacks = rating.feedbacks;
//         avg = rating.avg;
//     }

//     const result = {
//         name: found.name || found.username,
//         username: found.name ? found.username : null,
//         _id: found._id,
//         avatar: found.avatar,
//         feedbacks: feedbacks,
//         avg
//     };

//     res.send(result);
// });
// router.get("/user/setUp/:userId", allowed("owner"), async (req, res) => {
//     const { restaurantId, userId } = req.params;

//     const restaurant = await Restaurant(restaurantId).get({ projection: { staff: 1 } });

//     for(let i of restaurant?.staff!) {
//         if(i._id.toString() == userId) {
//             return res.send({ error: "works" });
//         }
//     }

//     const user = await getUser(userId, { projection: {
//         name: 1,
//         username: 1,
//     } });

//     res.send({
//         name: user?.name || user?.username,
//         _id: user?._id
//     });
// });
// router.get("/self/:restaurantId", async (req, res) => {
//     const { restaurantId } = req.params as any;

//     const result = await Restaurant(restaurantId).get({ projection: { owner: 1, staff: { settings: 1, role: 1, _id: 1, } } });

//     if(!result) {
//         return res.send(false);
//     }


//     if(result.owner?.equals(req.user as string)) {
//         return res.send(true);
//     }

//     for(let i of result?.staff!) {
//         if(i._id.equals(req.user as string) && i.role == "manager") {
//             const result = convertManagerSettings(i.settings as ManagerSettings);;
//             return res.send(result);
//         }
//     }

//     res.send(false);
// });




router.use("/update", UpdateRouter);
router.use("/dishes", DishesRouter);
router.use("/staff", StaffRouter);
router.use("/components", ComponentsRouter);


router.get("/init", allowed("manager"), async (req, res) => {
    const{ restaurantId } = req.params;

    const restaurant = await Restaurant(restaurantId).get({ projection: { name: 1 } });

    res.send({ restaurant, user: true });
});



router.patch("/findUsers", async (req, res) => {
    const { searchText } = req.body;

    const users = await getUsers({}, { projection: { name: 1, username: 1, } });

    const ids = [];

    for(let i of users) {
        if(
            i.name?.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()
                ||
            i.username!.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()
        ) {
            ids.push(i._id!);
        }
    }

    const users2 = await getUsers({ _id: { $in: ids } }, { projection: { name: 1, username: 1, avatar: 1 } });

    const result = [];


    for(let i of users2) {
        result.push({
            name: i.name || i.username,
            username: i.username,
            avatar: i.avatar,
            _id: i._id,
        });
    }


    res.send(result);
});
router.get("/user/:userId", allowed("manager", "staff"), async (req, res) => {
    const { userId, restaurantId } = req.params;

    const result = await getUser(userId, { projection: { name: 1, username: 1 } });
    const restaurant = await Restaurant(restaurantId).get({ projection: { staff: { _id: 1 } } });
    

    if(result._id!.equals(req.user as any)) {
        return res.send({ works: true });
    }
    for(let i of restaurant!.staff!) {
        if(i._id.equals(userId)) {
            return res.send({ works: true });
        }
    }

    res.send({
        name: result.name || result.username,
        username: result.username,
        _id: result._id,
    });
});



// interface OrderConverted {
//     user: { avatar: any; _id: any; username: string; };
//     _id: any;
//     date: string;
//     status: string;
//     color: string;
//     price: string;
//     dishes: { name: string; amount: number; _id: any; }[];
// }
// router.get("/orders", allowed("manager", "customers"), async (req, res) => {
//     const { restaurantId } = req.params;
    
//     const arr = await Stats(restaurantId).getMany(12);

//     if(!arr) {
//         return res.send(null);
//     }

//     const result: OrderConverted[] = [];
//     const globalTable = new DishHashTableUltra(restaurantId, { name: 1, price: 1 });
    
//     for(let i of arr!) {
//         const amountHashTable = () => {
//             const result: { [key: string]: number } = {};
//             for(let { dishId } of i.dishes) {
//                 const id = dishId.toString();
//                 if(result[id]) {
//                     result[id]++;
//                 } else {
//                     result[id] = 1;
//                 }
//             }
//             return result;
//         };
//         const getDate = () => {
//             const date = new Date(i.time);
//             return`${date.getDate()} ${months[date.getMonth()]}`;
//         };
        
//         const amounts = amountHashTable();

//         const user = await getUser(i.userId, { projection: { avatar: 1, username: 1 } });
//         const finalDishes = [];
//         let price = 0;


//         for(let o of Object.keys(amounts)) {
//             const dish = await globalTable.get(o);
//             if(dish) {
//                 price += dish.price!;
//                 (dish as any).amount = amounts[o];
//                 finalDishes.push(dish);
//             }
//         }

//         result.push({
//             user: user as any,
//             dishes: finalDishes as any,
//             price: `$${price.toFixed(2)}`,
//             date: getDate(),
//             _id: i._id,
//             color: i.status == 2 ? "green" : i.status == 3 ? "orange" : i.status == 1 ? "purple" : "red",
//             status: i.status == 2 ? "OK" : i.status == 3 ? "WARNING" : i.status == 1 ? "PROGRESS" : "DANGER"
//         });

//     }

//     res.send(result);
// });


// router.get("/invitings/get/:restaurant", async (req, res) => {
//     const { restaurant } = req.params;

//     const convert = await Restaurant(restaurant).get({ projection: { invitations: 1 } });


//     if(!convert || !convert.invitations) {
//         return res.sendStatus(404);
//     }


//     const promises = [];
//     const concat = [];


//     for(let { _id, userId, role, date } of convert.invitations) {
//         promises.push(getUserPromise({ _id: userId }, { projection: { name: 1, username: 1 } }));
//         concat.push({ _id, role, joined: getDate(date), userId });
//     }

//     let names: User[] = [];

//     try {
//         const result = await Promise.all(promises);

//         for(let i of result) {
//             if(result) {
//                 names.push(i!);
//             }
//         }
//     } catch (error) {
//         console.error(error);
//         throw new Error("radmin at /invitings/get/:restaurant");
//     }
    



//     const result = [];

//     for(let i in concat) {
//         const name = names[i].name || names[i].username;
//         result.push(Object.assign(concat[i], { name }));
//     }

//     res.send(result);
// });
// router.delete("/invitation/remove/:restaurant/:user/:id", async (req, res) => {
//     const { restaurant, user, id: iid } = req.params;

//     log("", "REMOVING INVITATION STARTED");

//     const changes1 = await Restaurant(restaurant).update(
//         { $pull: { invitations: { _id: id(iid) } } }
//     );

//     const changes2 = await updateUser(
//         user,
//         { $pull: { invitations: { _id: id(iid) } } }
//     );
    
//     if(changes1!.modifiedCount > 0) {
//         log("success", `removed invitation from restaurant [${restaurant}]`);
//     } else {
//         log("failed", `removed invitation from restaurant [${restaurant}]`);
//     }

//     if(changes2.modifiedCount > 0) {
//         log("success", `removed invitation from user [${restaurant}]`);
//     } else {
//         log("failed", `removed invitation from user [${restaurant}]`);
//     }

//     log("", "REMOVING INVITATION END");


//     res.send({ acknowledged: changes1!.modifiedCount > 0 && changes2.modifiedCount > 0 });
// });
// router.get("/cooking/dish/:restaurant/:id", async (req, res) => {
//     const { restaurant, id: dish } = req.params;

//     const workers = await getWorkersForCooking(restaurant, dish);
//     const { cooking, name } = await getDish(restaurant, dish, { cooking: 1, name: 1 });
//     const sendName = name!.toLowerCase();
    
    


//     if(!cooking) {
//         res.send({ components: [], recipee: "", name: sendName, workers });
//         return;
//     }

//     const restaurantFound= await Restaurant(restaurant).get({projection: { components: 1 }});
//     const c = restaurantFound?.components;
//     const { recipee, components, prefered } = cooking; 
//     const finalComponents = [];

    

//     if(components) {
//         for(let i of components) {
//             for(let j in c!) {
//                 if(c[j]._id!.toString() == i._id.toString()) {
//                     const { _id, name } = c[j];
//                     finalComponents.push({
//                         _id,
//                         name,
//                         type: "grams",
//                         amount: i.amount
//                     });
//                 }
//             }
//         }
//     }

    
//     res.send({ components: finalComponents, recipee, name: sendName, workers });
// });
// router.patch("/cooking/set", logged, allowed("staff", "dishes", "add"), async (req, res) => {
//     const {
//         cooking: { components: convert, recipee, workers: w }, 
//         info: { dishId },
//         restaurantId 
//     } = req.body;

//     log("info", "settings dish cooking started");

//     const dish = await getDish(restaurantId, dishId, { projection: { cooking: 1 } });

//     const getWorkers = () => {
//         const result = [];

//         for(let i of w) {
//             result.push(id(i)!);
//         };

//         return result;
//     };

//     console.log(convert);

//     const getComponents = () => {
//         const result = [];

//         for(let i of convert) {
//             result.push({
//                 amount: i.amount,
//                 _id: id(i._id)
//             });
//         }

//         return result;
//     }

//     if(!dish) {
//         log("failed", "no dish found");
//         return res.sendStatus(404);
//     } else if(!dish.cooking) {
//         const result = await updateDish(
//             restaurantId, 
//             dishId,
//             { $set: {
//                 cooking: {
//                     recipee,
//                     prefered: getWorkers(),
//                     components: getComponents()
//                 }
//             } }
//         );

//         if(result.modifiedCount > 0) {
//             log("success", "setting cooking to a dish");
//             return res.send({ success: true });
//         }

//         log("failed", "setting cooking to a dish");
//         return res.send({ success: false });
//     }


    
//     const workers = getWorkers();
//     const components = getComponents();
    

//     const update = await updateDish(
//         restaurantId,
//         dishId,
//         {
//             $set: { 
//                 "cooking.recipee": recipee,
//                 "cooking.components": components,
//                 "cooking.prefered": workers
//             }
//         }
//     );

//     console.log(update);


//     if(update.modifiedCount > 0) {
//         log("success", "updating dish cooking");
//         return res.send({success: true});
//     } else {
//         log("failed", "updating dish cooking");
//         return res.send({ success: false });
//     }
    

// });
// router.delete("/removeTutorials/:restaurant", logged, owner, async (req, res) => {
//     const { restaurant } = req.params;

//     const result = await Restaurant(restaurant).update(
//         { $set: { tutorials: null } }
//     );

//     if(result!.modifiedCount > 0) {
//         log("success", "removing tutorials");
//     } else {
//         log("failed", "removing tutorials");
//     }

//     res.send({});
// });


// router.delete("/remove/:id", logged, owner, async (req, res) => {
//     const { id } = req.params;

//     const restaurant = await Restaurant(id).get({ projection: { owner: 1, sname: 1 } });

//     if(!restaurant) {
//         return res.sendStatus(404).send({ error: "restaurant" });
//     }

//     const { invitations, staff, owner, _id } = restaurant;

//     for (let w of staff!) {
//         updateUser(
//             w._id,
//             { $pull: { works: id } }, 
//             { noResponse: true }
//         );
//     }
//     for (const { _id, userId } of invitations!) {
//         updateUser(
//             userId!,
//             { $pull: { invitations: _id } }
//         );
//     }

//     const result = await Promise.all([
//         client.db(db).collection("restaurants")
//             .deleteOne({ _id: new ObjectId(id) }, { noResponse: true }),
//         client.db(db).dropCollection(_id.toString()),
//         client.db(db).collection("work")
//             .deleteOne({ restaurant: new ObjectId(id) }, { noResponse: true }),
//         updateUser(
//             owner!,
//             { $pull: { "restaurants": new ObjectId(id) } },
//             { noResponse: true }
//         )
//     ]);

//     res.send(result);
// });


export {
    router as RadminRouter
}