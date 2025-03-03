import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema({
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
    index: true
  },
  avatar: {
    type: String, //cloudinary url
    required: true
  },
  coverImage: {
    type: String, //cloudinary url 
    index: true
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, "This field is required."]
  },
  refreshToken: {
    type: String
  }

}, {timestamps: true})

userSchema.pre("save",  async function (next) { // before save the data this hook will be called 
  //! We are using the function syntax instead  of arrow as we need to use the this context
  // We also need to use the async - await as these operations could take time.
  //? Also don't miss to add the next argument as it also needs.

  if (!this.isModified("password")) return next(); // password not modified // here we need to mention the attribute name in String

  this.password = await bcrypt.hash(this.password, 10)// here 10:: no. of hash rounds 
  next();

})

userSchema.methods.isPassWordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password) //it directly returns boolean value `true` or `false`.
}

export const User = mongoose.model("User", userSchema)