interface ManagerSettings {
    dishes: {
        overview?: boolean;
        add: boolean;
        remove: boolean;
    };
    work: {
        cook: boolean;
        waiter: boolean;
    };
    components: {
        overview?: boolean;
        add: boolean;
        remove: boolean;
    };
    staff: {
        overview?: boolean;
        hire: boolean;
        fire: boolean;
        settings: boolean;
        statistics: boolean;
    };
    customers: {
        blacklisting: boolean;
        statistics: boolean;
    };
    restaurant: {
        theme: boolean;
        logo: boolean;
    };
}
interface CookSettings {

}
interface WaiterSettings {

}

interface RestaurantSettings {
    customers: {
        orders: boolean;
        maxDishes: number;
        trust: 1 | 2 | 3;
    },
    work: {
        
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