import { NextFunction, Request, Response } from "express";
import { Settings } from "../models/components";
import { Locals } from "../models/other";
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
    option1?: keyof Settings.ManagerSettings,
    option2?:
        keyof Settings.ManagerSettings["work"]
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const restaurantId = req.params.restaurant || req.params.restaurantId || req.body.restaurant || req.body.restaurantId;

        const { user } = res.locals as Locals;

        if (!user) {
            throw "allowed middleware locals don't have user property";
            return res.sendStatus(401);
        }


        if (restaurantId) {
            const restaurant = await Restaurant(restaurantId).get({ projection: { owner: 1, staff: { userId: 1, settings: 1, role: 1 } } });
            if (!restaurant) {
                console.log("no restaurant");
                return res.sendStatus(404);
            } else if (!restaurant.owner) {
                console.log("no owner?");
                return res.sendStatus(404);
            }

            const { owner, staff } = restaurant;

            if (owner.equals(req.user as string)) {
                return next();
            }

            for (let i of staff!) {
                if (i.userId.toString() == req.user as string) {
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

        log("ERROR", 'no restaurant at allowed middleware');

        return res.status(403).send({ redirect: true });
    }
}



export {
    owner,
    allowed
}