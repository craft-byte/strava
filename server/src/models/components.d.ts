import { ObjectId } from "mongodb";


type Id = ObjectId | string;


interface Cooking {
    recipee: string;
    components: { amount: number; _id: ObjectId; }[];
    cooks: ObjectId[];
    modified: { date: number; userId: ObjectId; };
}







interface Time {
    hours: number;
    minutes: number;
    nextMinute: number;
    color: string;
}

export {
    Id,
    Time,
    Cooking,
    RestaurantSettings
}