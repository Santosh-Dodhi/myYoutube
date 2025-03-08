import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { Request } from "express";

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

export { registerUser };
