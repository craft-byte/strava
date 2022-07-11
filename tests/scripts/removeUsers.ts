import { client } from "./index";
import { config } from "../config";
import { usersCleaning } from "./db/userCleaning";


usersCleaning(config.dbName, config.strict);


