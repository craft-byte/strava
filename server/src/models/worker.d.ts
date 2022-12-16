import { ObjectId } from "mongodb";

interface WorkerCache {
    lastUpdate: number;
    data: {
        cooked?: number;
        served?: number;
        favoriteDish?: ObjectId;
    }
}

interface WorkerSettings {
    work?: {
        cook?: boolean;
        waiter?: boolean;
        manager?: boolean;
    };
    restaurant?: {
        settings?: boolean;
        dishes?: boolean;
        staff?: boolean;
        customers?: boolean;
    };
    isOwner?: boolean;
}

interface Worker {
    userId: ObjectId;
    joined: number;
    settings: WorkerSettings;
    lastManagerSettings?: Settings.ManagerSettings;

    workerCache?: WorkerCache;
    
    lastUpdate?: {
        time: number;
        userId: ObjectId;
    }
}


export {
    Worker,
}