import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
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

router.route("/change-password").post(jwtVerify, changeCurrentPassword);

router.route("/current-user").get(jwtVerify, getCurrentUser);

router.route("/update-details").patch(jwtVerify, updateAccountDetails);

router
  .route("/avatar")
  .patch(jwtVerify, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-image")
  .patch(jwtVerify, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(jwtVerify, getUserChannelProfile); // whatever we write after the colon is a parameter

router.route("/watch-history").get(jwtVerify, getUserWatchHistory);

export default router;
