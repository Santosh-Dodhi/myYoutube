import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  //take all the attributes: (username, email, fullName, avatar, password...) from Frontend
  //check if any attribute is empty
  //check if user already exists: (both) username, email
  //check for images; see avatar(required) is present or not
  //upload the images to the cloudinary
  //create a user obj in the db - create obj
  //remove password and refresh token from the mongo db response
  //check user created successfully or not in the response
  //return the response(res) to the frontend

  const { username, email, fullName, password } = req?.body;
  // console.log(password);

  //method I to check any field is empty
  // if (username.trim() === ""){
  //   throw new ApiError(400, "All fields are required.");
  // }

  //method II to check any field is empty
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existedUser = await User.findOne({
    //await is necessary
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists.");
  }

  const avatarLocalFilePath = (
    req.files as { [key: string]: Express.Multer.File[] }
  )?.avatar[0]?.path;
  // const coverImageLocalFilePath = (
  //   req.files as { [key: string]: Express.Multer.File[] }
  // )?.coverImage[0]?.path;

  interface MulterFile {
    path: string;
  }

  interface MulterRequest extends Request {
    files?: { [fieldname: string]: Express.Multer.File[] };
  }

  let coverImageLocalFilePath;
  const reqTyped = req as MulterRequest; // Type assertion for req.files

  if (
    reqTyped.files?.coverImage &&
    Array.isArray(reqTyped.files.coverImage) &&
    reqTyped.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = reqTyped.files.coverImage[0].path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar Image File is Required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath!);

  const avatarUrl =
    typeof avatar === "object" && avatar?.secure_url ? avatar.secure_url : null;
  const coverImageUrl =
    typeof coverImage === "object" && coverImage?.secure_url
      ? coverImage.secure_url
      : null;

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully", true));
});

const loginUser = asyncHandler(async (req, res) => {
  //take data from frontend req body
  //login using username or email
  //find the user
  //check password
  //generate the access and the refresh token
  //send cookie

  const { username, email, password } = req.body;
  console.log(username, email);

  if (!username && !email) {
    throw new ApiError(400, "Please enter your email or username to login.");
  }

  let user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User doesn't exists.");
  }

  const isPassWordValid = await user.isPassWordCorrect(password);
  if (!isPassWordValid) {
    throw new ApiError(400, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  ); //here instead of sending the user_$id, I am directly sending the user.

  // user = user.onselect('-password -refreshToken')
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while logging in the user.");
  }

  //cookie
  const options = {
    httpOnly: true,
    secure: true, // only server can change the cookie.
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: createdUser, accessToken, refreshToken },
        "User loggined successfully."
      )
    );
});

const generateAccessAndRefreshTokens = async (userId: any) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user!.generateAccessToken();
    const refreshToken = await user!.generateRefreshToken();

    user!.refreshToken = refreshToken;
    await user!.save({ validateBeforeSave: true }); //As by default User model needs password is required but validateBeforeSave: true suggests no need of password

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and the refresh tokens."
    );
  }
};

const logoutUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
  //delete the refresh token in the database
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    {
      $set: {
        refreshToken: "undefined",
      },
    },
    {
      new: true, //to return the object after updation
    }
  );

  //delete the cookies stored
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out."));
});

const refreshAccessToken = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken; //req.body if request is coming from the mobile user.
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request.");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload;

      const user = await User.findById(decodedToken._id);

      if (!user) {
        throw new ApiError(400, "Invalid Refresh Token");
      }

      if (user?.refreshToken !== incomingRefreshToken) {
        throw new ApiError(400, "Refresh Token is expired or used");
      }

      // const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user?._id);

      //! Here i have just updated the accessToken not the refreshToken.
      const newAccessToken = await user!.generateAccessToken();
      const options = {
        httpOnly: true,
        secure: true,
      };
      res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", incomingRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken: newAccessToken, refreshToken: incomingRefreshToken },
            "Updated Access Token"
          )
        );
    } catch (error) {
      const err = error as Error;
      throw new ApiError(
        501,
        err?.message ||
          "Something went wrong while generating the new AccessToken."
      );
    }
  }
);

const changeCurrentPassword = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isCorrect = await user?.isPassWordCorrect(oldPassword);
    if (!isCorrect) {
      throw new ApiError(400, "Old Password is incorrect");
    }
    user!.password = newPassword;
    await user?.save({ validateBeforeSave: false });
    res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
  }
);

const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(
      500,
      "Something went wrong while getting the user details."
    );
  }
  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Shared User Details Successfully"));
});

const updateAccountDetails = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
      throw new ApiError(400, "Please provide either email or full name");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    res
      .status(200)
      .json(new ApiResponse(200, { user }, "Updated the user details"));
  }
);

const updateUserAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const newAvatarFileLocalPath = req.file?.path;

    if (!newAvatarFileLocalPath) {
      throw new ApiError(400, "Please provide an avatar image file.");
    }

    const avatar = await uploadOnCloudinary(newAvatarFileLocalPath);
    const avatarUrl =
      typeof avatar === "object" && avatar?.secure_url
        ? avatar.secure_url
        : null;

    if (!avatarUrl) {
      throw new ApiError(500, "Failed to upload the avatar image.");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatarUrl,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    //TODO: Delete the old avatar image url from the cloudinary
    //Create a utility function for this.

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user },
          "Avatar Image file updated successfully."
        )
      );
  }
);

const updateUserCoverImage = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const newCoverImageFileLocalPath = req.file?.path;

    if (!newCoverImageFileLocalPath) {
      throw new ApiError(400, "Please provide an coverImage image file.");
    }

    const coverImage = await uploadOnCloudinary(newCoverImageFileLocalPath);
    const coverImageUrl =
      typeof coverImage === "object" && coverImage?.secure_url
        ? coverImage.secure_url
        : null;

    if (!coverImageUrl) {
      throw new ApiError(500, "Failed to upload the coverImage image.");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImageUrl,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    //TODO: Delete the old cover image url from the cloudinary
    //Create a utility function for this.

    res
      .status(200)
      .json(
        new ApiResponse(200, { user }, "CoverImage file updated successfully.")
      );
  }
);

const getUserChannelProfile = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { username } = req.params;

    if (!username.trim()) {
      throw new ApiError(400, "Username is missing in the params.");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          subscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] }, //Todo: See how this is working
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          refreshToken: 0,
          subscribers: 0,
          subscribedTo: 0,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "Channel not found.");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channel[0], //As the channel is an array of objects containing only one object.
          "Channel Profile fetched successfully."
        )
      );
  }
);

const getUserWatchHistory = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), //when using aggragate pipeline we need to use the ObjectId
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1, 
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner" //As the owner is an array of objects containing only 1 object.
              }
            }
          }
        ]
      }
    }
  ])

  res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully.")
  )
});

export {
  registerUser,
  loginUser,
  generateAccessAndRefreshTokens,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory
};
