interface Dish {
    _id: string;
    name: string;
    price: number;
    time: number;
    description: string;
    general: string;
    
    image: {
        binary: any;
        resolution: 1 | 1.33 | 1.77;
    }
}

export {
    Dish
}