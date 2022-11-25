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
        maxDishes: number;
        allowTakeAway: boolean;
        maxCustomers: number;
        minPrice: number;
        allowOrderingOnline: boolean;
    },
    dishes: {

    },
    staff: {
        mode: "solo" | "standart" | "disabled";
    }
}

export {
    RestaurantSettings
}