import { ObjectId } from "mongodb";
import { Settings } from "./components";

interface WorkerCache {
    lastUpdate: number;
    data: {
        cooked?: number;
        served?: number;
        favoriteDish?: ObjectId;
    }
}

interface Worker {
    userId: ObjectId;
    role: "manager" | "cook" | "waiter" | "owner";
    joined: number;
    settings: Settings.ManagerSettings | Settings.CookSettings | Settings.WaiterSettings;
    lastManagerSettings?: Settings.ManagerSettings;

    workerCache?: WorkerCache;
    
    lastUpdate?: {
        time: number;
        userId: ObjectId;
    }
}


export {
    Worker
}