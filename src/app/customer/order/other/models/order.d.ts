interface OrderDish {
    name: string;
    price: number;
    dishId: string;
    _id: string;
    comment: string;
}

type OrderType = "dinein" | "takeout";

type TaxType = "hst" | "tax";

export {
    OrderDish,
    OrderType,
    TaxType,
}