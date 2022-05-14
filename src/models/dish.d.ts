

interface Dish {
    name?: string;
    price?: number;
    time?: number;
    created?: Date;
    description?: string;
    types?: string[];
    categories?: string[];
    strict?: string[];
    general?: string[];
    image?: { data: string | any; resolution: number; date: string | Date };
    choosen?: boolean;
    bought?: number;
    _id: string;
    sale: { _id: string; to: Date };
    originalPrice: number;
    cooking?: { recipee: string; components: {v: number; id: string; }[] };
    dates?: Stats[];
    sales: { cost: number; _id: string; created?: Date; name: string; }[];
}



interface Stats {
    date: Date;
    quantity: number;
}



export {
    Dish,
    Stats,
}