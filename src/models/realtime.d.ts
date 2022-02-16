interface Restaurant {
    workers: Worker[];
    sname: string;
}

interface Work {
    kitchen: Kitchen[];
    waiter: Waiter[];
    tables: Table[];
}

interface SmallDish {
    _id: string;
    id: string;
}
interface Worker {
    socketId: string;
    _id: string;
}
interface Kitchen {
    dishes: SmallDish[];
}
interface Waiter {
    dishes: SmallDish[];
}
interface Table {
    number: string;
    dishes: string[];
    confirmed: { comment: string; dishes: string[] } []
}
interface Response {
    type: "connection";
    data: R.Connection;
    send: string[];
    event?: string;
}

declare namespace R {
    interface Connection {
        restaurant: Restaurant,
        work: Work;
    }
} 

interface TableDish {
    name: string;
    _id: string;
    image: string;
}

export {
    Work,
    TableDish,
    Restaurant,
    R,
    Table,
    Response
}