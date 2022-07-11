import { restaurantCleaning } from "./db/removeRestaurants";
console.log(process.argv[2]);


restaurantCleaning(process.argv[2] || "ctrabaTest", true);