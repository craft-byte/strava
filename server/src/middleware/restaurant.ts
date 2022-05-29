import { NextFunction, Request, response, Response } from "express";
import { ManagerSettings } from "../models/components";
import { log } from "../utils/functions";
import { Restaurant } from "../utils/restaurant";
import { getUser } from "../utils/users";


async function owner(req: Request, res: Response, next: NextFunction) {
    const restaurantId = req.params.restaurant || req.params.restaurantId || req.body.restaurant || req.body.restaurantId;


    if (!restaurantId) {
        log("failed", "middleware error in owner - no restaurant was provided");
        res.sendStatus(404);
        return;
    }
    if (!req.user) {
        log("failed", "middleware error in owner - no user found");
        res.sendStatus(404);
        return;
    }

    const user = await getUser(req.user as string, { projection: { _id: 1 } });

    if (!user) {
        log("failed", "middleware error in owner - user not exists");
        res.sendStatus(404);
        return;
    }

    const restaurant = await Restaurant(restaurantId).get({ projection: { owner: 1 } });

    if (!restaurant) {
        log("failed", "no restaurant found", restaurantId);
        res.sendStatus(404);
        return;
    }


    if (restaurant.owner!.toString() == req.user as string) {
        return next();
    }

    log("failed", "middleware error in owner - not owner");
    res.sendStatus(404);
    return;
}

function allowed(
    role: "owner" | "cook" | "waiter" | "manager" | "staff",
    option1?: keyof ManagerSettings,
    option2?:
        keyof ManagerSettings["work"] |
        keyof ManagerSettings["staff"] |
        keyof ManagerSettings["dishes"] |
        keyof ManagerSettings["customers"] |
        keyof ManagerSettings["restaurant"]
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const restaurantId = req.params.restaurant || req.params.restaurantId || req.body.restaurant || req.body.restaurantId;

        if (!req.user) {
            log("failed", "middleware - allowed - no req.user");
            return res.sendStatus(401);
        }


        if (restaurantId) {
            const restaurant = await Restaurant(restaurantId).get({ projection: { owner: 1, staff: { _id: 1, settings: 1, role: 1 } } });
            if (!restaurant) {
                log("failed", "middleware - allowed - no restaurant");
                return res.sendStatus(422);
            } else if (!restaurant.owner) {
                log("failed", "middleware - allowed - no owner");
                return res.sendStatus(422);
            }

            const { owner, staff } = restaurant;

            if (owner.equals(req.user as string)) {
                return next();
            }

            for (let i of staff!) {
                if (i._id.toString() == req.user as string) {
                    if(i.role == role && !option1) { // if role == user.role but not manager settings provided
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
                        if((i.settings as ManagerSettings).work[role]) {
                            return next();
                        }
                    } else if (role == "manager" && option1) { // if role == manager allowed to do an action

                        if (!option2) { // if no option2 provided user passes if any of settings[option1] == true
                            for(let s of Object.keys((i.settings as ManagerSettings)[option1])) {
                                if(((i.settings as ManagerSettings)[option1] as any)[s]) {
                                    return next();
                                }
                            }
                            

                            return res.sendStatus(403);
                        }
                        const result = ((i.settings as ManagerSettings)[option1] as { [key: string]: boolean })[option2];

                        if (result) {
                            return next();
                        }

                    }
                    break;
                }
            }



            return res.sendStatus(403);
        }

        log("ERROR", 'no restaurant at allowed middleware');

        return res.sendStatus(403);
    }
}



export {
    owner,
    allowed
}