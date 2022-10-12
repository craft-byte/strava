import cors from "cors";
import express from "express";
import compression from "compression";
import session from "express-session";
import cookieparser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "https";
import { createServer as createHttpServer } from "http"
import { MongoClient } from "mongodb";
import { UserRouter } from "./routers/user";
import { RadminRouter } from "./routers/restaurant";
import { serverEnvinroment } from "./environments/server";
import { StaffRouter } from "./routers/staff";
import nodemailer from "nodemailer";
import logger from "morgan";
import Stripe from "stripe";
import { readFileSync } from "fs";
import { StripeRouter } from "./routers/stripe";
import { SocketIO } from "./utils/io";
import { CustomerRouter } from "./routers/customer";
import { errorHandler } from "./utils/middleware/errorHandler";

export const MODE = process.argv[2] as "testing" | "prod" | "dev";


// export const stripe = new Stripe("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", { apiVersion: "2020-08-27" });
export const stripe = new Stripe("sk_test_51KNlK6LbfOFI72xWf6DWHg7bLESfEQLkCNSY5ohFgH1umLRSIpq68925RA81Codtwhf2mhuqH4Ixe533aoX860nj00bjv2ElfI", { apiVersion: "2022-08-01" });
export const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);

const sendEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ctraba.business@gmail.com',
        pass: 'tgphcddicttmsstf'
    }
});
// const key = readFileSync(process.cwd() + "/src/environments/localhost.key", "utf-8");
// const cert = readFileSync(process.cwd() + "/src/environments/localhost.crt", "utf-8");
const app = express();
const splitted = process.cwd().split("\\");
splitted.splice(splitted.length - 1, splitted.length);
// app.set('trust proxy', true);
app.use(logger("dev"));
// app.use(session({
//     saveUninitialized: false,
//     resave: false,
//     secret: "y06q9MHVaQfW01cUli4frrA7BsAuOGusilovecatsS",
//     cookie: {
//         httpOnly: false,
//         secure: true,
//         sameSite: "none",
//         maxAge: (4 * 60 * 60 * 1000)
//     }
// }));
app.use(compression());
app.use((req,res) => {
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAA ITWORKSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
});
app.use(
    cors(
        {
            credentials: true,
            optionsSuccessStatus: 200,
            origin: function (origin, callback) {
                // if ([
                //     "https://localhost:8101",
                //     "https://localhost:8100",
                //     "a.stripecdn.com",
                //     "api.stripe.com",
                //     "atlas.stripe.com",
                //     "auth.stripe.com",
                //     "b.stripecdn.com",
                //     "billing.stripe.com",
                //     "buy.stripe.com",
                //     "c.stripecdn.com",
                //     "checkout.stripe.com",
                //     "climate.stripe.com",
                //     "connect.stripe.com",
                //     "dashboard.stripe.com",
                //     "express.stripe.com",
                //     "files.stripe.com",
                //     "hooks.stripe.com",
                //     "invoice.stripe.com",
                //     "invoicedata.stripe.com",
                //     "js.stripe.com",
                //     "m.stripe.com",
                //     "m.stripe.network",
                //     "manage.stripe.com",
                //     "pay.stripe.com",
                //     "payments.stripe.com",
                //     "q.stripe.com",
                //     "qr.stripe.com",
                //     "r.stripe.com",
                //     "verify.stripe.com",
                //     "stripe.com",
                //     "terminal.stripe.com",
                //     "uploads.stripe.com",
                // ].indexOf(origin!) !== -1) {
                    callback(null, true);
                    // } else {
                        //     callback(new Error('Not allowed by CORS'))
                        // }
                    },
                }
    )
);
const server = createHttpServer(app);
// const server = createServer({ key, cert }, app);
const io: Server = require("socket.io")(server, serverEnvinroment.ioOptions);
// app.use((req, res, next) => {
    //     console.log(req.headers.referer);
    
    //     res.setHeader('Access-Control-Allow-Origin', "https://localhost:8100");
    
    
    
    //     // Request methods you wish to allow
    //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', "true");
    
//     // res.setHeader("SameSite", "Lax");

//     next();
// });
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(splitted.join("/") + "/www"));


// passport.serializeUser(function (user: any, cb) {
//     cb(null, user._id);
// });
// passport.deserializeUser(function (user: Express.User, cb) {
//     cb(null, user);
// });
// passport.use(PassportJWT());

// app.use(passport.initialize());
// app.use(passport.session());




(async function () {
    await main(client);
})();

async function main(client: MongoClient) {
    try {
        await client.connect();

        app.use("/api/user", UserRouter);
        app.use("/api/restaurant/:restaurantId", RadminRouter);
        app.use("/api/staff", StaffRouter);
        // app.use("/api/client", ClientRouter);        //// REMOVE CLIENT FOLDER AND client.ts
        app.use("/api/customer", CustomerRouter);
        app.use("/api/stripe", StripeRouter);

        app.get("**", (req, res) => {
            console.log("UNKNOWN URI");
            // if(MODE != "prod") {
            //     return res.sendStatus(404);
            // }
            const splitted = process.cwd().split("\\");
            splitted.splice(splitted.length - 1, splitted.length);
            res.sendFile(splitted.join("/") + "/www/index.html");
        });
        
        app.use(errorHandler);

        io.on("connection", SocketIO);
    } catch (e) {
        console.error(e);
        throw new Error("Mongo Connection");
    }
}

server.listen(process.env.PORT || 3000, () => {
    console.log(`HTTP server listening on port: ${(process.env.PORT || 3000)}`);
});



export {
    sendEmail as Email,
    io
}