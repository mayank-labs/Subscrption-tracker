import mongoose from "mongoose";

import { DB_URI, NODE_ENV } from "../config/env.js"

if (!DB_URI) {
    throw new Error("please provide the database uri in env file");
}
const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`Database connected successfully in ${NODE_ENV} mode`);
    }
    catch (error) {
        console.log("Error while connecting to database", error);
        process.exit(1);
    }
};
export default connectToDatabase;