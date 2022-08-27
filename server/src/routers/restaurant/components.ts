import { Router } from "express";
import { allowed } from "../../middleware/restaurant";
import { Component } from "../../models/components";
import { getDate, id } from "../../utils/functions";
import { convertComponents } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });

router.get("/all/:dishId", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId, dishId } = req.params;

    const result = await Restaurant(restaurantId).components.getAll({ modified: 1, name: 1, amount: 1, _id: 1, });

    const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { cooking: { components: 1 } } });

    if(!result) {
        return res.sendStatus(404);
    }
    if(!dish) {
        return res.sendStatus(404);
    }

    const components = [];

    for(let i of result) {
        let add = true;
        if(dish.cooking!.components) {
            for(let j of dish!.cooking!.components) {
                if(i._id!.equals(j._id!)) {
                   add = false; 
                }
            }
        }
        if(add) {
            components.push({
                modified: getDate(i.modified!),
                name: i.name,
                amount: i.amount,
                _id: i._id
            });
        }
    }

    res.send(components);
});
router.get("/", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).components.getAll({ modified: 1, name: 1, amount: 1, _id: 1, });

    if(!result) {
        return res.sendStatus(404);
    }

    const components = [];

    for(let i of result) {
        components.push({
            modified: getDate(i.modified!),
            name: i.name,
            amount: i.amount,
            _id: i._id
        });
    }

    res.send(components);
});
router.post("/", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { component } = req.body;

    const newComponent = Object.assign(
        component, 
        {
            _id: id(), 
            modified: new Date(),
            used: [],
            history: [],
            warning: 30,
            created: new Date(),
        }
    );
    newComponent.price *= 100;

    const result = await Restaurant(restaurantId).update(
        { $push: { components: newComponent } }
    );

    console.log("component added: ", result!.modifiedCount> 0); 

    res.send({ component: {
        ...newComponent,
        modified: getDate(newComponent.modified)
    } });
});
router.delete("/:componentId", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId, componentId } = req.params as any;

    const result = await Restaurant(restaurantId).update({ $pull: { components: { _id: id(componentId) } } });

    console.log("component removed: ", result!.modifiedCount > 0);

    res.send({ removed: result!.modifiedCount > 0 });
});
router.patch("/", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { searchText } = req.body;

    
    const components = await Restaurant(restaurantId).components.getAll({ name: 1, amount: 1, _id: 1, price: 1, });
    
    if(!searchText || searchText.length == 0) {
        return res.send(components);
    }

    if(!components || components.length == 0) {
        return res.send([]);
    }

    const result = [];

    for(let i of components) {
        if(i.name!.toLocaleLowerCase().substring(0, searchText.length) == searchText.toLocaleLowerCase()) {
            result.push(...convertComponents([i]));
        }
    }

    res.send(result);
});



router.patch("/edit/:componentId", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId, componentId } = req.params as any;
    const { updated } = req.body;

    if(!updated) {
        return res.sendStatus(422);
    }

    const { name, price, amount } = updated;

    const result = await Restaurant(restaurantId).update(
        {
            $set: {
                "components.$[s1].name": name,
                "components.$[s1].price": price,
               "components.$[s1].amount": amount
            }
        },
        { 
            arrayFilters: [{ "s1._id": id(componentId) }] 
    });

    console.log("component edited: ", result!.modifiedCount > 0);

    res.send(result);
});
router.patch("/update/:componentId", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId, componentId } = req.params;
    const { amount, warning } = req.body;

    
    if((amount && amount < 1) || (warning && warning < 0)) {
        return res.sendStatus(422);
    }

    const updateFilter: any = {
        $inc: {
            "components.$[s1].amount": amount || 0
        },
        $set: {
            "components.$[s1].modified": new Date()
        }
    };
    if(warning) {
        updateFilter.$set["components.$[s1].warning"] = Math.floor(warning);
    }

    const result = await Restaurant(restaurantId).update(
        updateFilter,
        { arrayFilters: [{ "s1._id": id(componentId) }] }
    );

    console.log("component updated: ", result!.modifiedCount > 0);

    res.send(result);
});
router.get("/:componentId", allowed("manager", "ingredients"), async (req, res) => {
    const { restaurantId, componentId } = req.params as any;

    const result = await Restaurant(restaurantId).aggregate<{ component: Component }>([
        { $unwind: "$components" },
        { $match: { "components._id": id(componentId) } },
        { $project: { component: "$components" } }
    ]);

    if (!result || !result[0] || !result[0].component) {
        return res.sendStatus(404);
    }

    res.send(result[0].component);
});



export {
    router as ComponentsRouter
}