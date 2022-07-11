// import { FindOptions, ObjectId, UpdateFilter } from "mongodb";
// import { client } from "..";
// import { db } from "../environments/server";
// import { id } from "./functions";



// interface Session {
//     _id: ObjectId;
//     restaurantId?: ObjectId;
//     userId?: ObjectId;
//     dishes?: any[];
//     type?: "order" | "table";
//     number?: number;
//     expiresAt: Date;
// } 


// function Sessions() {
//     return {
//         get: (options: FindOptions<Session>) => {
//             return {
//                 userId: async (userId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").findOne({ userId: id(userId) }, options);

//                         return result as Session;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//                 restaurantId: async (restaurantId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").findOne({ restaurantId: id(restaurantId) }, options);

//                         return result as Session;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//                 sessionId: async (sessionId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").findOne({ sessionId: id(sessionId) }, options);

//                         return result as Session;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//             }
//         },
//         aggregate: async (pipeline: any[]) => {
//             try {
//                 const result = await client.db(db).collection("sessions").aggregate(pipeline).toArray();

//                 return result;
//             } catch (e) {
//                 throw e;
//             }
//         },
//         update:  (update: UpdateFilter<Session>) => {
//             return {
//                 userId: async (userId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").updateOne({ userId: id(userId) }, update);

//                         return result;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//                 restaurantId: async (restaurantId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").updateOne({ restaurantId: id(restaurantId) }, update);

//                         return result;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//                 sessionId: async (sessionId: string | ObjectId) => {
//                     try {
//                         const result = await client.db(db).collection("sessions").updateOne({ sessionId: id(sessionId) }, update);

//                         return result;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//             }
//         },
//         many: (search: any) => {
//             return {
//                 get: async (options: FindOptions<Session>) => {
//                     try {
//                         const result = await client.db(db).collection("sessions")
//                             .find(search, options).toArray();

//                         return result;
//                     } catch (e) {
//                         throw e;
//                     }
//                 },
//             }
//         },
//         add: async (session: Session) => {
//             try {
//                 const result = await client.db(db).collection("sessions")
//                     .insertOne(session);


//                 return result;
//             } catch (e) {
//                 throw e;
//             }
//         } 

//     }
// }

// export {
//     Sessions
// }