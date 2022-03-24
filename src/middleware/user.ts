import { NextFunction, Request, Response } from "express";
import { session } from "../routers/user";
import { log } from "../routers/functions";

function logged(req: Request, res: Response, next: NextFunction) {
    if(!session) {
        log("no session");
        // res.redirect("/login");
        res.sendStatus(401);
        return;
    }
    if(session.userid) {
        next();
        return;
    } else {
        log("not logged", req.ip);
        res.sendStatus(401);
        return;
    }
}


export {
    logged
}