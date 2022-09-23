import { getUser } from "../users";
import * as jsonwebtoken from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { FindOptions } from "mongodb";
import { User } from "../../models/general";
import { PRIV_KEY } from "../passport";


/**
 *
 * @param {FindOptions<User>} options  -  options for getUser method
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
export function logged(options: FindOptions<User>) {
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

        const user = await getUser(data.userId, options);

        if (!user) {
            return res.status(401).send({ reason: "UserNotFound", redirect: true });
        }

        res.locals.user = user;

        return next();
    };
}