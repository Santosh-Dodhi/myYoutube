import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
  videofile: {
    type: String, //cloudinary url
    required: true,
  },
  thumbnail: {
    type: String, //cloudinary url
    required: true,
  },
  title: {
    type: String, 
    required: true,
  },
  description: {
    type: String, 
    required: true,
  },
  duration: {
    type: Number, 
    required: true,
  },
  views: {
    type: Number, 
    required: true,
  },
  isPublished: {
    type: , 
    required: true,
  },
},{timestamps: true})