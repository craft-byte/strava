import { Router } from "express";
import { allowed } from "../../middleware/restaurant";
import { Component } from "../../models/components";
import { getDate, id, log } from "../../utils/functions";
import { convertComponents } from "../../utils/other";
import { Restaurant } from "../../utils/restaurant";


const router = Router({ mergeParams: true });


router.get("/", allowed("manager", "components"), async (req, res) => {
    const { restaurantId } = req.params as any;

    const components = await Restaurant(restaurantId).components.getAll({ name: 1, _id: 1, warning: 1, amount: 1, modified: 1, price: 1 });

    const result: any = {
        warning: [],
        components: convertComponents(components),
    }

    for(let i of components) {
        if(i.amount! < i.warning!) {
            result.warning.push(...convertComponents([i]));
        }
    }

    res.send(result);
});
router.post("/", allowed("manager", "components", "add"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { component } = req.body;

    const newComponent = Object.assign(
        component, 
        {
            _id: id(), 
            modified: new Date(),
            uses: [],
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
router.delete("/:componentId", allowed("manager", "components", "remove"), async (req, res) => {
    const { restaurantId, componentId } = req.params as any;

    const result = await Restaurant(restaurantId).update({ $pull: { components: { _id: id(componentId) } } });

    console.log("component removed: ", result!.modifiedCount > 0);

    res.send({ removed: result!.modifiedCount > 0 });
});
router.patch("/", allowed("manager", "components"), async (req, res) => {
    const { restaurantId } = req.params as any;
    const { searchText } = req.body;

    
    const components = await Restaurant(restaurantId).components.getAll({ name: 1, amount: 1, _id: 1, price: 1, });
    
    if(!searchText || searchText.length == 0) {
        return res.send(components);
    }

    if(!components) {
        return res.send([]);
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



router.patch("/edit/:componentId", allowed("manager", "components", "add"), async (req, res) => {
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
router.patch("/update/:componentId", allowed("manager", "components", "add"), async (req, res) => {
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
router.get("/get/:componentId", allowed("manager", "components"), async (req, res) => {
    const { restaurantId, componentId } = req.params as any;

    const result = await Restaurant().aggregate<{ component: Component }>([
        { $match: { _id: id(restaurantId) } },
        { $unwind: "$components" },
        { $match: { "components._id": id(componentId) } },
        { $project: { component: "$components" } }
    ]);

    if (!result || !result[0] || !result[0].component) {
        return res.send(null);
    }

    res.send(result[0].component);
});
router.get("/all", allowed("manager", "components"), async (req, res) => {
    const { restaurantId } = req.params;

    const result = await Restaurant(restaurantId).components.getAll();

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
})


export {
    router as ComponentsRouter
}