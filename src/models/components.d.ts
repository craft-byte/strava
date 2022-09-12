interface ManagerSettings {
    dishes: boolean;
    ingredients: boolean;
    staff: boolean;
    customers: boolean;
    settings: boolean;
    work: {
        cook: boolean;
        waiter: boolean;
    };
}
interface CookSettings {

}
interface WaiterSettings {

}

interface RestaurantSettings {
    customers: {
        maxDishes: number | "unlimited";
        allowTakeAway: boolean;
        // trust: 1 | 2 | 3;
        maxCustomers: number | "unlimited";
        maxPrice: "unlimited" | number;
        minPrice: number;
    },
    work: {
        maxOrdersCooking: number | "unlimited";
    },
    dishes: {
        strictIngredients: boolean;
        types: 1 | 2;
    },
    payments: {

    }
}

interface Worker {
    _id: string;
    role: string;
    prefers: string[];
    joined: Date;
    settings: ManagerSettings | CookSettings | WaiterSettings
}

interface Component {
    name?: string;
    amount?: number; // grams
    price?: number;
    modified?: Date;
    _id?: string;
    warning?: number;
}

interface Table {
    number: number;
    taken?: boolean;
    userId?: string;
    _id: string;
}

interface Category {
    value: string;
    title: string;
    img: string;
}

export {
    Worker,
    Table,
    Category,
    Component,
    ManagerSettings,
    RestaurantSettings
}