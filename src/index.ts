import dotenv from "dotenv";
import connectDB from "./db/index";
import app from "./app";

dotenv.config();

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error occurred while connecting with the express app");
      throw err;
    });

    const myPort = process.env.PORT || 8000;
    app.listen(myPort, () => {
      console.log(`The app is running on the PORT:: ${myPort}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting with the Mongoose Database:: ", err);
  });
