import { NextFunction, Request, Response } from "express";
import { Filter, ObjectId } from "mongodb";
import { Order } from "../../models/Order";
import { id } from "../functions";
import { Orders } from "../orders";





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
        const { status, userId, ct } = res.locals as { ct: ObjectId; status: "loggedin" | "loggedout" | "noinfo"; userId: string | null; };
        const { restaurantId } = req.params;

        if(!status || !restaurantId) {
            throw "no res.locals.status found at passOrder() middleware";
        }

        let filter: Filter<Order>;
        if(status == "loggedin" || status == "loggedout") {
            filter = { customer: id(userId!), status: "ordering" };
        } else {
            filter = { customerToken: ct, status: "ordering" };
        }

        const order = await Orders(restaurantId).one(filter).get({ projection });

        if(!order) {
            return res.status(403).send({ reason: "OrderNotFound" });
        }

        res.locals.order = order;
        return next();
    };
}