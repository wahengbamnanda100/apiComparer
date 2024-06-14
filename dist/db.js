"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.collectionName = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { MONGO_URI } = process.env;
// const dbNameTest = "ApiView";
const dbName = "Comparer";
// export const collectionNameTest = "api_compare";
exports.collectionName = "CompareApi";
// console.log("process.env", process.env.MONGO_URI);
const client = new mongodb_1.MongoClient(MONGO_URI);
exports.db = client.db(dbName);
client.connect();
// Call the function to connect to MongoDB
// connectToMongoDB();
//# sourceMappingURL=db.js.map