import mongoose, { Schema } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: mongoose.Schema.Types.ObjectId[];
  password: string;
  refreshToken?: string;

  isPassWordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    coverImage: {
      type: String, //cloudinary url
      index: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "This field is required."],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // before save the data this hook will be called
  //! We are using the function syntax instead  of arrow as we need to use the this context
  // We also need to use the async - await as these operations could take time.
  //? Also don't miss to add the next argument as it also needs.

  if (!this.isModified("password")) return next(); // password not modified // here we need to mention the attribute name in String

  this.password = await bcrypt.hash(this.password, 10); // here 10:: no. of hash rounds
  next();
});

userSchema.methods.isPassWordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password); //it directly returns boolean value `true` or `false`.
};

userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.ACCESS_TOKEN_SECRET as string;
  const expiry = process.env.ACCESS_TOKEN_EXPIRY as string;
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    "SdzVoDt4sAqzbw2XKf73CW32uFTZ9vbvqHwJ9x7hG0DMdseqKRJ1ehAVz8XSjkTkk4at8cfIhU7Hy78WpyTRDXBDSbEzcvCtApcbODHP2sUtAs66k7WLVzH4cvbCiHHb",
    {
      expiresIn: "1d",
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET?.toString;
  const expiry = process.env.REFRESH_TOKEN_EXPIRY as string;
  return jwt.sign(
    {
      _id: this._id,
    },
    "BBALbKDCS7pV9focmgzzzBIIrBbdKZzgKs9aEV1hLZmVJwI93pLcx4sIgS2e5Ovzd1E9xc7lQUuJf7pzZLL157p7PP9xR3hIbrLZprJZ9GlfaJ5DwCsjPa2YUcTHh738",
    {
      expiresIn: "10d",
    }
  );
};

export const User = mongoose.model<IUser>("User", userSchema);
