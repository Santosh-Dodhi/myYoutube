import mongoose, { Schema } from "mongoose";

const UserSchema = mongoose.Schema({
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
  fullname: {
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

export const User = mongoose.model("User", UserSchema)