import { Router } from "express";
import {registerUser} from "../controllers/user.controller"

const router = Router();

router.get('/', (req, res)=>{
  console.log("Request on /api/v1/users");
  res.send("HEHEHHE");
});
router.route("/register").get(registerUser);

export default router