import { NextFunction, Request, Response } from "express";
import { Settings } from "../../models/components";
import { Locals } from "../../models/other";
import { Restaurant } from "../restaurant";
import { Restaurant as RestaurantType } from "./../../models/general";


type RestaurantProjection = {
    [key in keyof RestaurantType]?: (1 | 0) | { [a in keyof RestaurantType[key]]?: 0 | 1 };
}


/**
 * 
 * @param { key: number } projection - projection of restaurant. will be returned res.locals.restaurant
 * @param { string } role - user role
 * @param { string } option1 - capabilities (dishes - can this user manage dishes?)
 * @param { string } option2 - more specific (cook - can this user work as cook)(option1 has to be "work")
 * 
 * 
 * Function checks if a user is member of a restaurant staff
 * 
 * @throws { status: 404; reason: "NoRestaurant" } - restaurant not found
 * @throws { status: 403; redirect: true; } - user if not a member of restaurant staff will be redirected to user/info
 * 
 * returns restaurant with @param projection in res.locals.restaurant
 * 
 */
export function allowed(
    projection: RestaurantProjection,
    role: "owner" | "cook" | "waiter" | "manager" | "staff",
    option1?: keyof Settings.ManagerSettings,
    option2?:
        keyof Settings.ManagerSettings["work"]
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const restaurantId = req.params.restaurant || req.params.restaurantId || req.body.restaurant || req.body.restaurantId;

        const { user } = res.locals as Locals;


        if (!user) {
            return next("at utils/middleware/restaurantAllowed.ts allowed() res.locals missing user property");
            return res.sendStatus(401);
        }

        const options = { projection: { ...projection, }, };

        if(!options.projection.info) {
            options.projection.info = { owner: 1 };
        } else if(options.projection.info && options.projection.info != 1) {
            (options.projection.info as any).owner = 1;
        }


        if(!options.projection.staff) {
            options.projection.staff = { userId: 1, settings: 1, role: 1 };
        } else if(typeof options.projection.staff != "number") {
            options.projection.staff = { ... options.projection.staff, userId: 1, role: 1, settings: 1,}
        }


        if (restaurantId) {
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

            for (let i of staff!) {
                if (user._id.equals(i.userId)) {
                    if(i.role == "owner") {
                        console.log("OWNER ==============");
                        return next();
                    } else if(i.role == role && !option1) { // if role == user.role but not manager settings provided
                        return next();
                    } else if(role == "staff") { // if role == cook | waiter | manager.cook | manager.waiter
                        if(
                            i.role == "waiter" ||
                            i.role == "cook" ||
                            i.role == "manager"
                        ) {
                            return next();
                        }
                    } else if((role == "cook" || role == "waiter") && i.role == "manager") { // if role == cook | manager then should let manager.cook & manager.waiter
                        if((i.settings as Settings.ManagerSettings).work[role]) {
                            return next();
                        }
                    } else if (role == "manager" && option1) { // if role == manager allowed to do an action

                        if (!option2) {
                            if((i.settings as Settings.ManagerSettings)[option1]) {
                                return next();
                            }

                            return res.status(403).send({ redirect: true });
                        }
                        
                        const result = ((i.settings as Settings.ManagerSettings)[option1] as { [key: string]: boolean })[option2];

                        if (result) {
                            return next();
                        }

                    }
                    break;
                }
            }



            return res.status(403).send({ redirect: true });
        }

        return res.status(403).send({ redirect: true });
    }
}