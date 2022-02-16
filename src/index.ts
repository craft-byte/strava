import * as express from "express";
import { MongoClient } from "mongodb";
import { AdminRouter } from "./routers/admin";
import * as cors from "cors";
import { UserRouter } from "./routers/user";
import { RadminRouter } from "./routers/radmin";
import { DishRouter } from "./routers/dish";
import { CustomerRouter, CustomerSocket } from "./routers/customer";
import { Server } from "socket.io";
import { serverEnvinroment } from "./environments/server";
import { CustomerResponse } from "./models/customer";
import { StaffRouter, StaffSocket } from "./routers/staff";
import { RealTimeSocket } from "./routers/realtime";
import * as session from "express-session";
import * as cookieparser from "cookie-parser";
import * as compression from "compression";
import { createServer } from "http";
// import * as sslRedirect from "heroku-ssl-redirect";
import * as multer from "multer";

declare module 'express-session' {
    export interface SessionData {
        userid: string;
    }
}


const upload = multer({ dest: 'uploads/' }).single("image");

const app = express();
const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);
const server = createServer(app);
// const keyPath = process.cwd() + "/src/environments/";
// const server = http.createServer({
//     key: readFileSync(keyPath + "localhost-private.pem"),
//     cert: readFileSync(keyPath + "localhost-cert.pem")
// }, app);

const io: Server = require("socket.io")(server, serverEnvinroment.ioOptions);

// app.use(sslRedirect.default());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use(cookieparser());
app.use(session({
    secret: "kOIogusYjHjIZ7WNUfug6JOk86HONqTmthisismysecretkey",
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    saveUninitialized: true,
    resave: false
}));

(async function() {
    await main(client);
})();

async function main(client: MongoClient) {
    try {
        await client.connect();

        app.use("/api/customer", CustomerRouter);
        app.use("/api/user", UserRouter);
        app.use("/api/admin", AdminRouter);
        app.use("/api/radmin", RadminRouter);
        app.use("/api/dish", DishRouter);
        app.use("/api/staff", StaffRouter);

        app.get("*", (_req, res) => {
            res.sendFile(__dirname + "/index.html");
        });

        io.on("connection", socket => {
            CustomerSocket(socket).subscribe((res: CustomerResponse) => {
                for(let id of res.send) {
                    io.to(id).emit(res.event ? res.event : "customerResponse", res);
                }
            });
            StaffSocket(socket).subscribe(res => {
                if(res.e) {
                    for(let id of res.send) {
                        socket.broadcast.to(id).emit(res.event || "staffResponse", res);
                    }
                    return;
                }
                for(let id of res.send) {
                    io.to(id).emit(res.event || "staffResponse", res);
                }
            });
            RealTimeSocket(socket).subscribe(res => {
                for(let id of res.send) {
                    io.to(id).emit(res.event || "RealTimeResponse", res);
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
    client,
    upload
}