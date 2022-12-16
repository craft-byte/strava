import cors from "cors";
import express from "express";
import compression from "compression";
import { Server } from "socket.io";
import { createServer } from "https";
import { createServer as createHttpServer, Server as HTTPServer } from "http"
import { MongoClient } from "mongodb";
import { UserRouter } from "./routers/user";
import { RestaurantRouter } from "./routers/restaurant";
import { serverEnvinroment } from "./environments/server";
import { StaffRouter } from "./routers/staff";
import logger from "morgan";
import Stripe from "stripe";
import { readFileSync } from "fs";
import { StripeRouter } from "./routers/stripe";
import { CustomerRouter } from "./routers/customer";
import { errorHandler } from "./utils/middleware/errorHandler";
import enforce from "express-sslify";
import path from "path";

export const MODE = process.argv[2] as "testing" | "prod" | "dev";



// production stripe \/
// export const stripe = new Stripe("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", { apiVersion: "2020-08-27" });
//                   /\


// dev stripe \/
export const stripe = new Stripe("sk_test_51KNlK6LbfOFI72xWf6DWHg7bLESfEQLkCNSY5ohFgH1umLRSIpq68925RA81Codtwhf2mhuqH4Ixe533aoX860nj00bjv2ElfI", { apiVersion: "2022-08-01" });
//            /\


// AIzaSyDhzbYdNc0MJO3jEJ64cYY15pzwqubDRrk - google api

export const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);



const app = express();
app.use(compression());
app.use(enforce.HTTPS());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, "..", "..", "www")));
app.set("trust proxy", true);
app.use(cors({
    credentials: true,
    optionsSuccessStatus: 200,
    origin: function (origin, callback) {
        callback(null, true);
    },
}));


let server: HTTPServer;
if (MODE == "prod") {
    server = createHttpServer(app);
    app.use(logger("tiny"));
} else {
    app.use(logger("dev"));
    const key = readFileSync(process.cwd() + "/src/environments/localhost.key", "utf-8");
    const cert = readFileSync(process.cwd() + "/src/environments/localhost.crt", "utf-8");
    server = createServer({ key, cert }, app);
}

const io: Server = require("socket.io")(server, serverEnvinroment.ioOptions);


(async function () {
    await main(client);
})();

async function main(client: MongoClient) {
    try {
        await client.connect();

        app.use("/api/user", UserRouter);
        app.use("/api/restaurant/:restaurantId", RestaurantRouter);
        app.use("/api/staff", StaffRouter);
        app.use("/api/customer", CustomerRouter);
        app.use("/api/stripe", StripeRouter);

        app.get("/.well-known/apple-developer-merchantid-domain-association", (req, res) => {
            res.sendFile(path.join(__dirname, "..", "src", "/assets/apple-developer-merchantid-domain-association"));
        });

        app.get("**", (req, res) => {
            res.sendFile(path.join(__dirname, "..", "..", "www", "index.html"));
        });

        app.use(errorHandler);


        /**
         * 
         * SOCKET IO
         * used to send data between customer and restaurant staff
         * 
         * function below connects user to socket.io and assigns socket.id to it
         * 
         * socket id can be accessed on frontend (angular)
         * socket id is used to send data to specific user
         * 
         * socket id is saved to customer's orders (routers/customer/session.ts) (Order.socketId)
         * when data needs to be sent, staff can access the socket id of customer and send the data (routers/staff/kitchen or waiter)
         * 
         * these functions are used to send data:
         *      sendMessageToCustomer
         *      sendMessageToWaiter
         *      sendMessageToCook
         * 
         */
        io.on("connection", socket => {
            console.log("NEW SOCKET CLIENT: ", socket.id);
        });
    } catch (e) {
        console.error(e);
    }
}

server.listen(process.env.PORT || 3000, () => {
    console.log(`HTTP server listening on port: ${(process.env.PORT || 3000)}`);
});



export {
    io
}