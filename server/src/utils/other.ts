import { ObjectId } from "mongodb";
import { categories } from "../assets/consts";
import { Component, Feedback, ManagerSettings, Time } from "../models/components";
import { getDate, id } from "./functions";
import { Restaurant } from "./restaurant";
import { getUserPromise } from "./users";


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
function getWorked(time: number) {
    return `${Math.floor(time / 86400000)} days`;
}
async function getRestaurantName(restaurantId: string | ObjectId) {
    const found = await Restaurant(restaurantId).get({ projection: { name: 1 } });

    if(!found) {
        return "Removed restaurant";
    } else {
        return found.name;
    }
}
async function getWorkersForCooking(restaurantId: string, dish: string) {
    const found = await Restaurant(restaurantId).get({ projection: { staff: { role: 1, _id: 1, prefers: 1 } } });

    const staff = found?.staff;

    const userPromises = [];

    for(let i = 0; i < staff!.length; i++) {
        if(staff![i].role == "cook") {
            userPromises.push(getUserPromise({ _id: staff![i]._id }, {projection: { avatar: 1, name: 1, username: 1 }}));
        } else {
            staff!.splice(i, 1);
            i--;
        }
    }

    let users = null;

    try {
        users = await Promise.all(userPromises);
    } catch (e) {
        console.error(e);
        throw new Error("at getWorkersForCooking() getting users");
    }

    const result = [];

    if(users.length == 0) {
        return [];
    }

    for(let i in users) {
        if(i) {
            console.log(staff![i].prefers);
            const user = {
                name: users[i]!.name || users[i]!.username,
                avatar: users[i]!.avatar || null,
                choosen: false,
                _id: users[i]!._id
            };
            if(staff![i].prefers) {
                for(let j of staff![i].prefers!) {
                    if(j.toString() == dish){
                        user.choosen = true;
                        break;
                    }
                }
            }
    
            result.push(user);
        }
    }

    return result;
}
function getCategory(c: string) {
    for(let { value, title, img } of categories) {
        if(value == c) {
            return { title, img };
        }
    }
}
function convertDishes(dishes: any) {
    const result: any[] = [];

    for(let i of dishes) {
        result.push({
            name: i.name,
            time: `${i.time} m.`,
            price: `$${i.price / 100}`,
            _id: i._id,
            image: i.image
        });
    }

    return result;
}
function convertManagerSettings(settings: ManagerSettings) {
    
    const result: any = settings;

    result.dishes.overview = settings.dishes.add || settings.dishes.remove;
    result.staff.overview = settings.staff.fire || settings.staff.settings || settings.staff.settings || settings.staff.statistics;
    result.components.overview = settings.components.add;
    result.restaurant.overview = settings.restaurant.logo || settings.restaurant.name || settings.restaurant.theme;


    return result;
}
async function convertFeedbacks(feedbacks: Feedback[]) {

    if(!feedbacks || feedbacks.length == 0) {
        return null!;
    }

    const result = [];

    let ratings = 0;


    for(let i of feedbacks) {
        ratings += i.stars;
        result.push({
            time: getWorked(i.worked),
            restaurant: await getRestaurantName(i.restaurantId),
            stars: i.stars,
            text: i.comment,
            role: i.role
        });
    }


    return { feedbacks: result, avg: (ratings / feedbacks.length).toFixed(2) };
}


function isAddToJobs(settings: ManagerSettings) {
    return settings.work.cook || settings.work.waiter;
}

function isAddToRestaurants(settings: ManagerSettings) {
    return  settings.components.add ||
            settings.components.remove ||
            settings.customers.blacklisting ||
            settings.customers.statistics ||
            settings.dishes.add ||
            settings.dishes.remove ||
            settings.restaurant.logo ||
            settings.restaurant.theme ||
            settings.staff.fire ||
            settings.staff.hire ||
            settings.staff.settings ||
            settings.staff.statistics;
}


function convertComponents(components: Component[]) { 
    const result = [];


    for(let i of components) {
        result.push({
            name: i.name,
            _id: i._id,
            amount: `${i.amount} grams`,
            date: getDate(i.modified!)
        });
    }


    return result;
}


function getIds(arr: { _id: any }[]) {
    const result = [];
    for(let i of arr) {
        result.push(id(i._id)!);
    }
    return result;
}


export {
    getWorked,
    getIds,
    isAddToJobs,
    isAddToRestaurants,
    getRestaurantName,
    convertDishes,
    convertComponents,
    getCategory,
    convertFeedbacks,
    convertManagerSettings,
    getWorkersForCooking,
    getDelay,
    bufferFromString,
}