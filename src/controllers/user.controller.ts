import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { Request } from "express";
import { ObjectId } from "mongoose";

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
  const createdUser = await User.findById(user._id).select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while logging in the user.")
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

const logoutUser = asyncHandler(async (req, res) => {});

export { registerUser, loginUser, generateAccessAndRefreshTokens, logoutUser };
