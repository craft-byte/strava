import { getUser } from "../users";
import * as jsonwebtoken from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { FindOptions } from "mongodb";
import { User } from "../../models/general";
import { PRIV_KEY } from "../passport";


type UserProjection = {
    [key in keyof User]?: (1 | 0) | { [key2 in keyof (User[key] extends Array<any> ? User[key][0] : User[key])]?: 1 | 0 };
}



/**
 *
 * @param {UserProjection} projection  -  options for getUser method
 *
 *
 * @throws { status: 401; reason: "TokenNotProvided" } - token not provided
 * @throws { status: 401; reason: "TokenExpired" } - token expired
 * @throws { status: 401; reason: "TokenInvalid" } - token is invalid
 * @throws { status: 401; reason: "UserNotFound" } - user not found
 * @throws { + redirect: boolean } - redirect user to /login or not (handled in other/interceptor.ts)
 *
 * if logged in user saved in req.locals.user
 *
 * @returns { user: User }
 *
 */
export function logged(projection: UserProjection) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            return res.status(401).send({ reason: "TokenNotProvided", redirect: true });
        }
        const token = req.headers.authorization.replace("Bearer ", "");

        const data: { userId: string; iat: number; exp: number; } = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

        if (Date.now() > data.exp) {
            return res.status(401).send({ reason: "TokenExpired", redirect: true });
        }

        if (!data.userId) {
            return res.status(401).send({ reason: "TokenInvalid", redirect: true });
        }

        const user = await getUser(data.userId, { projection });

        if (!user) {
            return res.status(401).send({ reason: "UserNotFound", redirect: true });
        }

        res.locals.user = user;

        return next();
    };
}


/**
 *
 * if user is logged in 
 *  
 * @returns { userId: string } - res.locals.userId if user has token saved
 */
export function passUserData(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        if(!req.headers["customer-token"]) {
            return res.status(403).send({ reason: "CustomerTokenNotProvided" });
        }
        res.locals.ct = req.headers["customer-token"];
        res.locals.status = "noinfo";
        return next();
    }
    const token = req.headers.authorization;

    const data: { userId: string; iat: number; exp: number; } = jsonwebtoken.verify(token, PRIV_KEY, { algorithms: ["RS256"] }) as any;

    if (Date.now() > data.exp) {
        res.locals.status = "loggedout";
    } else {
        res.locals.status = "loggedin";
    }

    if (!data.userId) {
        return next();
    }

    res.locals.userId = data.userId;

    return next();
};