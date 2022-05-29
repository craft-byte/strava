import { NextFunction, Request, Response } from "express";


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

export {
    logged,
    order,
}