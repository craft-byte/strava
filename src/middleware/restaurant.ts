import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { client } from "../index";
import { db } from "../environments/server";
import { session } from "../routers/user";
import { log } from "../routers/functions";

async function sname(req: Request, res: Response, next: NextFunction) {
    const restaurant = req.params.restaurant || req.body.restaurant;
    if (!restaurant) {
        log("middleware error in owner - no restaurant found");
        res.sendStatus(404);
        return;
    }
    if (!session.userid) {
        log("middleware error in owner - no user found");
        res.sendStatus(404);
        return;
    }

    const user = await client.db(db).collection("users")
        .findOne({ _id: new ObjectId(session.userid) }, { projection: { restaurants: 1 } });

    if (!user) {
        log("middleware error in owner - user not exists");
        res.sendStatus(404);
        return;
    }

    const restaurantsP = [];


    for (let i of user.restaurants) {
        restaurantsP.push(client.db(db).collection("restaurants").findOne({ _id: new ObjectId(i) }, { projection: { sname: 1 } }));
    }

    const restaurants = await Promise.all(restaurantsP);

    for(let { sname } of restaurants) {
        if(sname == restaurant) {
            next();
            return;
        }
    }

    log("middleware error in owner - not owner");
    res.sendStatus(404);
    return;
}

async function owner(req: Request, res: Response, next: NextFunction) {
    const restaurant = req.params.restaurant || req.body.restaurant;
    if (!restaurant) {
        log("middleware error in owner - no restaurant found");
        res.sendStatus(404);
        return;
    }
    if (!session.userid) {
        log("middleware error in owner - no user found");
        res.sendStatus(404);
        return;
    }

    const user = await client.db(db).collection("users")
        .findOne({ _id: new ObjectId(session.userid) }, { projection: { restaurants: 1 } });

    if (!user) {
        log("middleware error in owner - user not exists");
        res.sendStatus(404);
        return;
    }

    const id = restaurant.toString();

    for (let i of user.restaurants) {
        if(i === id) {
            next();
            return;
        }
    }

    log("middleware error in owner - not owner");
    res.sendStatus(404);
    return;
}


export {
    owner,
    sname
}