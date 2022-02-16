import { ObjectId } from "mongodb";
import { Confirm } from "./customer";

interface Restaurant {
    _id: string;
    name?: string;
    sname?: string;
    owner?: string;
    tables?: Table[];
    staff?: Worker[];
    settings?: RestaurantSettings;
    payments?: string[];
    components?: Component[];
}
interface RestaurantSettings {
    dishes: {
        strictDishCookingCheck: boolean;
        dishesComponents: boolean;
        allTypes: boolean;
    };
    customers: {
        onlyTableOrders: boolean;
        onlyByQR: boolean;
    };
    payments: {

    };
    work: {
        withNoAccount: boolean;
    }
}


interface Worker {
    _id?: string;
    role?: "admin" | "manager" | "cook" | "waiter",
    settings?: ManagerSettings;
    joined?: Date;
}

interface ManagerSettings {

}









interface Dish {
    name: string;
    _id: string;
}

interface FullDish {
    price: number;
    name: string;
    _id?: string;
    time: number;
    description: string;
    types: string[];
    categories: string[];
    image: string;

}


interface Table {
    number: number;
    taken?: boolean;
    userId?: string;
    _id: string | ObjectId;
}

interface User {
    name: string;
    _id: string;
    username: string;
    avatar: string;
}



interface Path {
    url: string;
    queryParams?: any;
}

interface CardData {
    title: string;
    imageLink: string;
    mainGo: Path;
    links: {
        go: Path;
        title: string;
        buttonType: "search" | "add" | "analytics" | "none";
    }[];
}

interface Component {
    name?: string;
    amount?: number;
    price?: number;
    type?: "g" | "k" | "p";
    used?: {
        date: string;
        for: string;
        value: string;
    }[];
    modified?: Date;
    _id?: string | ObjectId;
}

interface Work {
    kitchen?: Confirm[];
    waiter?: Confirm[];
    _id: string;
    restaurant?: string;
}

export {
    Restaurant,
    User,
    Component,
    RestaurantSettings,
    Path,
    FullDish,
    Work,
    Dish,
    CardData,
    Table,
    Worker
}