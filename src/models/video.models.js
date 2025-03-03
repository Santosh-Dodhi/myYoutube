import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
    type: Number, //will get this from the cloudinary 
    required: true,
  },
  views: {
    type: Number, 
    default: 0,
  },
  isPublished: {
    type: Boolean, 
    default: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }
},{timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate) // To use the aggregate queries

export const Video = mongoose.model("Video", videoSchema)