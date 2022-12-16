import { NextFunction, Request, Response } from "express";
import { Worker } from "../../models/worker";
import { Locals } from "../../models/other";
import { Restaurant } from "../restaurant";
import { Restaurant as RestaurantType } from "./../../models/Restaurant";


type RestaurantProjection = {
    [key in keyof RestaurantType]?: (1 | 0) | { [a in keyof RestaurantType[key]]?: 0 | 1 };
}


/**
 * 
 * @param { RestaurantProjection } projection - projection of restaurant. will be returned res.locals.restaurant
 * @param { Worker["settings"] } settings[] - user role
 * 
 * 
 * Function checks if a user is member of a restaurant staff
 * 
 * @throws { status: 404; reason: "NoRestaurant" } - restaurant not found
 * @throws { status: 403; redirect: true; } - user if not a member of restaurant staff will be redirected to user/info
 * 
 * returns restaurant with @param projection in res.locals.restaurant
 * 
 * goes through each settings and if one == true passes user
 */
export function allowed(
    projection: RestaurantProjection,
    ...settings: Worker["settings"][]
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const restaurantId = req.params.restaurant || req.params.restaurantId || req.body.restaurant || req.body.restaurantId;

        const { user } = res.locals as Locals;


        if (!user) {
            return next("at utils/middleware/restaurantAllowed.ts allowed() res.locals missing user property");
            return res.sendStatus(401);
        }

        const options = { projection: { ...projection, }, };

        if (!options.projection.info) {
            options.projection.info = { owner: 1 };
        } else if (options.projection.info && options.projection.info != 1) {
            (options.projection.info as any).owner = 1;
        }


        if (!options.projection.staff) {
            options.projection.staff = { userId: 1, settings: 1, role: 1 };
        } else if (typeof options.projection.staff != "number") {
            options.projection.staff = { ...options.projection.staff, userId: 1, role: 1, settings: 1, }
        }

        if (!restaurantId) {
            return res.status(403).send({ redirect: true });
        }

        const restaurant = await Restaurant(restaurantId).get(options);
        res.locals.restaurant = restaurant;

        if (!restaurant) {
            return res.status(404).send({ reason: "NoRestaurant" });
        } else if (!restaurant.info?.owner) {
            return res.status(403).send({ redirect: true });
        }


        const { info: { owner, }, staff } = restaurant;

        if (owner.equals(user._id)) {
            return next();
        }

        for (let worker of staff!) {
            if (user._id.equals(worker.userId)) {

                if (worker.settings.isOwner) {
                    return next();
                }

                let index = 0;

                while(settings.length > index) {
                    const isAllowed = compareSettings(worker.settings, settings[index]);
                    if(isAllowed) {
                        return true;
                    }
                    index++;
                }

                break;
            }
        }



        return res.status(403).send({ redirect: true });
    }
}


function compareSettings(
    settings1: Worker["settings"],
    settings2: Worker["settings"]
) {
    return Object.entries(settings2).every(([key1, value1]: [string, boolean | object]) => {
        if (typeof value1 === "object") {
            return Object.entries(value1).every(([key2, value2]) => {
                return settings1[key1 as keyof Worker["settings"]]![key2 as keyof Worker["settings"]["work"]] === value2;
            });
        }
        return settings1[key1 as keyof Worker["settings"]] === value1;
    });
}