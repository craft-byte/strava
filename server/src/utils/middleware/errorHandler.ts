import { NextFunction, Request, Response } from "express";
import { client } from "../..";
import { mainDBName } from "../../environments/server";

export async function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    
    const update = await client.db(mainDBName).collection("errors").insertOne({ error: err, url: req.url, date: Date.now(), ip: req.ip });

    console.log("ERROR", "saved: ", update.acknowledged, err);

    res.status(500).send({ reason: "InvalidError" });
}
