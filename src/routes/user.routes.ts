import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { jwtVerify } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(jwtVerify, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

export default router;
