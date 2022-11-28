export const serverEnvinroment = {
    ioOptions: {
        withCredentials: true,
        upgradeTimeout: 10000,
        cors: {
            origin: (_o: string, cb: Function) => {
                cb(null, true);
            },
        }
    }
}

export const mainDBName = "stravaTest";
export const ordersDBName = "ordersTest";
export const dishesDBName = "dishesTest";
export const historyDBName = "historyTest";

// export const mainDBName = "strava";
// export const ordersDBName = "orders";
// export const dishesDBName = "dishes";
// export const historyDBName = "history";