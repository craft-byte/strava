import { MongoClient } from "mongodb";

const client = new MongoClient(`mongodb+srv://bazhan:Kaliman228@cluster0.lbe4g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`);


export {
    client
}