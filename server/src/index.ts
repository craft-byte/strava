import cors from "cors";
import multer from "multer";
import express from "express";
import compression from "compression";
import session from "express-session";
import cookieparser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "https";
import { MongoClient } from "mongodb";
import { UserRouter } from "./routers/user";
import { DishRouter } from "./routers/dish";
import { RadminRouter } from "./routers/restaurant";
import { serverEnvinroment } from "./environments/server";
import { StaffRouter } from "./routers/staff";
import { ClientResponse, KitchenResponse, WaiterResponse } from "./models/responses";
import passport from "passport";
import LocalStrategy from "passport-local";
import { passportFunction } from "./utils/passport";
import { ClientRouter } from "./routers/client";
import nodemailer from "nodemailer";
import { ClientSocket } from "./routers/client/client-socket";
import logger from "morgan";
import { KitchenSocket } from "./routers/staff/kitchen/functions";
import { WaiterSocket } from "./routers/staff/waiter/functions";
import { logged } from "./middleware/user";
import Stripe from "stripe";
import { readFileSync } from "fs";

export const MODE = process.argv[2] as "testing" | "prod" | "dev";


export const stripe = new Stripe("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", { apiVersion: "2020-08-27" });
export const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);

const sendEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ctraba.business@gmail.com',
        pass: 'tgphcddicttmsstf'
    }
});
declare module 'express-session' {
    export interface SessionData {
        userid: string;
    }
}
const key = readFileSync(process.cwd() + "/src/environments/localhost.key", "utf-8");
const cert = readFileSync(process.cwd() + "/src/environments/localhost.crt", "utf-8");
const upload = multer({ dest: 'uploads/' }).single("image");
const app = express();
const server = createServer({ key, cert }, app);
const io: Server = require("socket.io")(server, serverEnvinroment.ioOptions);
const splitted = process.cwd().split("\\");
splitted.splice(splitted.length - 1, splitted.length);

app.use(logger("dev"));
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: "y06q9MHVaQfW01cUli4frrA7BsAuOGusilovecatsS",
    cookie: {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: (4 * 60 * 60 * 1000)
    }
}));
app.use(compression());
app.use(
    cors(
        {
            credentials: true,
            origin: function (origin, callback) {
                if (["https://localhost:8101", "https://localhost:8100"].indexOf(origin!) !== -1) {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            }
        }
    )
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(splitted.join("/") + "/www"));
app.use(cookieparser());


passport.serializeUser(function (user: any, cb) {
    cb(null, user._id);
});
passport.deserializeUser(function (user: Express.User, cb) {
    cb(null, user);
});
passport.use("local", new LocalStrategy.Strategy(
    passportFunction
));

app.use(passport.initialize());
app.use(passport.session());




(async function () {
    await main(client);
})();

async function main(client: MongoClient) {
    try {
        await client.connect();

        app.use("/api/user", UserRouter);
        app.use("/api/restaurant/:restaurantId", logged, RadminRouter);
        app.use("/api/dish", DishRouter);
        app.use("/api/staff", StaffRouter);
        app.use("/api/client", ClientRouter);

        app.get("**", (req, res) => {
            console.log("UNKNOWN URI");
            if(MODE != "prod") {
                return res.sendStatus(4041);
            }
            const splitted = process.cwd().split("\\");
            splitted.splice(splitted.length - 1, splitted.length);
            res.sendFile(splitted.join("/") + "/www/index.html");
        });

        io.on("connection", socket => {
            ClientSocket(socket).subscribe((res: ClientResponse) => {
                for (let id of res.send) {
                    io.to(id).emit(res.event ? res.event : "client", res);
                }
            });
            KitchenSocket(socket).subscribe((res: KitchenResponse) => {
                for (let id of res.send) {
                    io.to(id).emit(res.event ? res.event : "kitchen", res);
                }
            });
            WaiterSocket(socket).subscribe((res: WaiterResponse) => {
                for (let id of res.send) {
                    io.to(id).emit(res.event ? res.event : "waiter", res);
                }
            });
        });
    } catch (e) {
        console.error(e);
        throw new Error("Mongo Connection");
    }
}

server.listen(process.env.PORT || 3000, () => {
    console.log(`HTTP server listening on port: ${(process.env.PORT || 3000)}`);
});



export {
    upload,
    sendEmail as Email,
}