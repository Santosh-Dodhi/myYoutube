import mongoose from "mongoose";
import { DB_Name } from "../constants";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
        // console.log(connectionInstance);
        console.log(`\n Mongoose DB Connected!! \n DB Host:: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error('MongoDB Connection FAILED:: ', error);
        process.exit(1);
    }
};

export default connectDB;