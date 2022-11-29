import e from "cors";
import { Router } from "express";
import { Timestamp } from "mongodb";
import { Locals } from "../models/other";
import { id } from "../utils/functions";
import { logged } from "../utils/middleware/logged";
import { manyRestaurants, Orders, Restaurant } from "../utils/restaurant";
import { HistoryRouter } from "./customer/history";
import { OrderRouter } from "./customer/order";



const router = Router();


router.use("/order/:restaurantId", OrderRouter);
router.use("/history", HistoryRouter);


router.get("/restaurants", async (req, res) => {
    
    const restaurants = await manyRestaurants({ status: "enabled" }, { projection: {
        name: 1,
        status: 1,
        _id: 1,
        settings: {
            money: { cash: 1, card: 1, },
        },
        info: {
            description: 1,
            time: 1,
            location: { line1: 1, line2: 1, city: 1, }
        }
    } });

    const result = [];

    for(let i of restaurants) {
        if(i.settings?.money?.card || i.settings?.money?.cash) {
            let payment;
            let time;
            let timeStatus;

            if(i.settings?.money.card == "enabled" && i.settings?.money.cash == "enabled") {
                payment = "all";
            } else if(i.settings?.money.card == "enabled") {
                payment = "card";
            } else {
                payment = "cash";
            }

            if(i.info?.time) {
                time = {
                    opens: {
                        ...i.info.time.opens,
                        minutes: i.info.time.opens.minutes.toString().length == 1 ? `0${i.info.time.opens.minutes}` : i.info.time.opens.minutes,
                    },
                    closes: {
                        ...i.info.time.closes,
                        minutes: i.info.time.closes.minutes.toString().length == 1 ? `0${i.info.time.closes.minutes}` : i.info.time.closes.minutes,
                    }
                }

                if(time.opens.half == "PM") {
                    time.opens.hours = time.opens.hours - 12;
                }
                if(time.closes.half == "PM") {
                    time.closes.hours = time.closes.hours - 12;
                }
                
                const date = new Date();
                if(date.getHours() < i.info.time.opens.hours || date.getHours() > i.info.time.closes.hours) {
                    timeStatus = "closed";
                } else if(date.getHours() == i.info.time.opens.hours) {
                    if(date.getMinutes() < i.info.time.opens.minutes) {
                        timeStatus = "closed";
                    } else {
                        timeStatus = "open";
                    }
                } else if(date.getHours() == i.info.time.closes.hours) {
                    if(date.getMinutes() > i.info.time.closes.minutes) {
                        timeStatus = "closed";
                    } else {
                        timeStatus = "open";
                    }
                } else {
                    timeStatus = "open";
                }
            }

            result.push({
                name: i.name,
                _id: i._id,
                location: i.info?.location,
                description: i.info?.description,
                payment,
                time,
                timeStatus
            });
        }
    }

    res.send(result);
});



export {
    router as CustomerRouter,
}