import { NextFunction, Request, Response } from "express";
import { getUser } from "../utils/users";


function logged(req: Request, res: Response, next: NextFunction) {
    if(req.isAuthenticated()) {
        return next();
    } else {
        return res.sendStatus(401);
    }
}

function order(req: Request, res: Response, next: NextFunction) {
    const restaurantId = req.params.restaurantId;

    if(!restaurantId || restaurantId.length != 24) {
        return res.sendStatus(404);
    }

    next();
}

async function email(req: Request, res: Response, next: NextFunction) {
    const user = await getUser(req.user as string, { projection: { email: 1 } });

    if(!user.email) {
        return res.sendStatus(403);
    }

    next();
}

export {
    logged,
    order,
    email,
}