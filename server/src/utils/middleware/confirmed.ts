import { NextFunction, Request, Response } from "express";
import { Locals } from "../../models/other";


/**
 * 
 * express middleware
 * checks if user.status == 'enabled'
 * 
 * @param { boolean } redirect - if true redirects else handled by angular app
 * 
 * @throws { error } - if no user in locals
 * @throws { status: 401; redirec: true } - if stauts == 'deleted'
 * @throws { status: 403; reason: "AccountNotConfirmed"; redirect: true; } 
 *      - user.status == 'restricted' and email not confirmed
 *      - in interceptor.ts if redirect true redirects
 * 
 */
export function confirmed(redirect: boolean = true) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { user } = res.locals as Locals;
    
        if(!user) {
            throw "at confirmed() no user?";
        }
    
        if(!user.status) {
            throw "no user status at confirmed()";
        }
    
        if(user.status == "enabled") {
            return next();
        }
    
        if(user.status == "restricted") {
            res.status(403).send({ reason: "AccountNotConfirmed", redirect });
        } else {
            res.status(401).send({ redirect: true });
        }
    }
}
