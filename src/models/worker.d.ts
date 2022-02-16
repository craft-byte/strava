interface User {
    username: string;
    name?: string;
    _id: string;
}

interface Worker {
    _id: string;
    cooks?: string[];
}

interface Restaurant {
    name: string;
    _id: string;
}


export {
    User,
    Worker,
    Restaurant
}