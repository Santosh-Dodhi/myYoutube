// The below line will work but we want consistenty in the import statement in our whole project. So we will use another method for this.

// require('dotenv').config({path: './env'})

import dotenv from 'dotenv';
import connectDB from "./db/index.js";

dotenv.config({
    path: './env' // Tells that ./env file is present in out root directory.
})

connectDB()