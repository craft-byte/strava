interface Restaurant {
    name: string;
    sname: string;
    _id: string;
    history: History[];
    stats: Stat[];
}

interface History {

}

interface Stat {
    str: string;
    bought: number;
    dishes: string[];
    date: Date;
}


export {
    Stat,
    Restaurant,
    History
}