import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MAX_FILE_SIZE } from "./constants";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({limit: MAX_FILE_SIZE}))
app.use(express.urlencoded({extended: true, limit: MAX_FILE_SIZE})) // to understand URL Encoding & extended: true for accepting nested object
app.use(express.static("public")) // To store user img or files temporary in the server.
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes"

//routes
app.get('/', (req, res)=>{
  console.log("Health check");
  res.send("Health Check Success");
});
app.use("/api/v1/users", userRouter)

export default app;