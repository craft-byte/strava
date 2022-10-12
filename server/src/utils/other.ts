import { ObjectId } from "mongodb";
import { Time } from "../models/components";
import { Restaurant } from "./restaurant";


function getDelay(time: number | Date): Time {

    let number: number = null!;

    if(typeof time == "number") {
        number = time;
    } else if(time instanceof Date) {
        number = time.getTime();
    } else {
        return null!;
    }


    const difference = (Date.now() - number) / 1000;

    const hours = Math.floor(difference / 3600);
    const minutes = difference % 3600 / 60;

    

    return {
        hours: hours,
        minutes: Math.floor(minutes),
        nextMinute: Math.floor((Math.ceil(minutes) - minutes) * 60000),
        color: hours > 0 || minutes > 15 ? "red" : minutes > 7 ? "orange" : "green"
    };    
}
async function getRelativeDelay(relativeTo: number | Date, time: number | Date, d?: { dishId: string | ObjectId; restaurantId: string | ObjectId }): Promise<any> {
    let number: number = null!;

    if(typeof time == "number") {
        number = time;
    } else if(time instanceof Date) {
        number = time.getTime();
    } else {
        return null!;
    }


    const difference = (number - (typeof relativeTo == "number" ? relativeTo : new Date(relativeTo).getTime())) / 1000;

    const hours = Math.floor(difference / 3600);
    const minutes = difference % 3600 / 60;
    

    if(d) {
        const { restaurantId, dishId } = d;
        const dish = await Restaurant(restaurantId).dishes.one(dishId).get({ projection: { info: { time: 1, } } });

        if(!dish) {
            return {
                hours: hours,
                minutes: Math.floor(minutes),
                color: hours > 0 || minutes > 15 ? "red" : minutes > 7 ? "orange" : "green"
            };
        }

        const hrs = Math.ceil(dish.info.time! / 60);
        const mins = dish.info.time!;


        let color: string;

        if(hours > hrs) {
            color = "red";
        } else {
            const mind = Math.ceil(minutes - mins);
            if(mind > 5) {
                color = "orange";
            } else if (mind > 15) {
                color = "red";
            } else {
                color = "green";
            }
        }

        return {
            hours: hours,
            minutes: Math.floor(minutes),
            color
            // color: hours > 0 || minutes > 15 ? "red" : minutes > 7 ? "orange" : "green"
        }; 
    }

    return {
        hours: hours,
        minutes: Math.floor(minutes),
        color: hours > 0 || minutes > 15 ? "red" : minutes > 7 ? "orange" : "green"
    }; 
}


function bufferFromString(a: string) {
    if(typeof a != "string") {
        console.log("bufferFromString type is not string");
        return;
    }
    let str = a.replace("data:image/jpg;base64,", "");
    str = str.replace("data:image/jpeg;base64,", "");
    str = str.replace("data:image/png;base64,", "");

    return Buffer.from(str, "base64");
}

export {
    getRelativeDelay,
    getDelay,
    bufferFromString,
}