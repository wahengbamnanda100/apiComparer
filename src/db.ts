import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_URI } = process.env;

// const dbNameTest = "ApiView";
const dbName = "Comparer";
// export const collectionNameTest = "api_compare";
export const collectionName = "CompareApi";

// console.log("process.env", process.env.MONGO_URI);

const client = new MongoClient(MONGO_URI!);

export const db = client.db(dbName);

client.connect();

// Call the function to connect to MongoDB
// connectToMongoDB();
