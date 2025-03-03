// The below line will work but we want consistenty in the import statement in our whole project. So we will use another method for this.

// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env", // Tells that ./env file is present in out root directory.
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error occurred while connecting with the express app");
      throw err;
    });

    myPort = process.env.PORT || 8000;
    app.listen(myPort, () => {
      console.log(`The app is running on the PORT:: ${myPort}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting with the Mongoose Database:: ", err);
  });
