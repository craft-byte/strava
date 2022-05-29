

interface Dish {
    name?: string;
    price?: number;
    time?: number;
    created?: Date;
    modified?: Date;
    description?: string;
    categories?: string[];
    strict?: string[];
    general?: string[];
    image?: { binary: string | any; resolution: number; date: string | Date };
    bought?: number;
    _id: string;
    cooking?: { recipee: string; components: {v: number; id: string; }[] };
}



interface Stats {
    date: Date;
    quantity: number;
}



export {
    Dish,
    Stats,
}