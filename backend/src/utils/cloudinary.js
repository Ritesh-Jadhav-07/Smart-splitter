import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // MUST be first thing

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) throw new Error("No file path provided");

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "smart-users",
    });

    console.log("File uploaded on Cloudinary successfully:", response.url);

    // Delete local temp file safely
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new Error("Failed to upload file to Cloudinary");
  }
};
