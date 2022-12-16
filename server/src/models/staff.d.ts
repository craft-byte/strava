import { ObjectId } from "mongodb"
import { Time } from "./components"
import { OrderDish } from "./Order";


interface ParsedOrderDish extends OrderDish {
    time: Time;
    orderId: string | ObjectId;
}


export {
    ParsedOrderDish,
}