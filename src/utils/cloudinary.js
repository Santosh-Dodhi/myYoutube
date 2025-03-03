import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// ! We are creating this file to upload the image stored in the local storage of the server to the cloudinary database.

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return "LocalFilePath not found while uploading the images."

    //upload the file on the cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    //file has been uploaded successfully
    console.log('File is uploaded on cloudinary.')
    console.log(response);
    return response;

  } catch (error) {
    //if file has not been loaded so we will remove the locally saved temp file
    fs.unlinkSync(localFilePath) // sync states it will move after unlinking the file only.
    return null
  }
}


export {uploadOnCloudinary}