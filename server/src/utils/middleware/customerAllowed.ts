import { NextFunction, Request, Response } from "express";
import { id } from "../functions";
import { Orders } from "../restaurant";







/**
 * 
 * checks if user has an order and passes it to the next middleware
 * 
 * @param { OrderProjeciton } projection - order projection
 * @returns { order: Order } - res.locals.order found order with projection
 * 
 * @throws { status: 403; reason: "OrderNotFound"; }
 * 
 */
export function passOrder(projection: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { status, userId } = res.locals as { status: "loggedin" | "loggedout" | "noinfo"; userId: string | null; };
        const { restaurantId } = req.params;

        if(!status || !restaurantId) {
            throw "no res.locals.status found at passOrder() middleware";
        }

        if(status == "loggedin" || status == "loggedout") {
            const customer = id(userId!)!;

            const order = await Orders(restaurantId).one({ customer }).get({ projection });

            if(!order) {
                return res.status(403).send({ reason: "OrderNotFound" });
            }

            res.locals.order = order;
            return next();
        }

        
        const order = await Orders(restaurantId).one({ ip: req.ip }).get({ projection });

        if(!order) {
            return res.status(403).send({ reason: "OrderNotFound" });
        }

        res.locals.order = order;
        return next();
    };
}