import { User } from "../models/user.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const accessTokens = user.generateAccessTokens();
    const refreshTokens = user.generateRefreshTokens();

    user.refreshTokens = refreshTokens;

    await user.save({ validateBeforeSave: false });
    return { accessTokens, refreshTokens };
  } catch (error) {
    console.log("TOKEN GENERATION ERROR:", error); // 👈 ADD THIS
    throw error;
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if ([email, name, password].some((field) => !field?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ name }, { email }],
    });

    if (existedUser) {
      throw new ApiError(400, "User with Name or Email already exists");
    }

    const profilePhotoLocalPath = req.files?.profilePhoto?.[0]?.path;
    if (!profilePhotoLocalPath) {
      throw new ApiError(400, "Profile Photo is required");
    }

    // Upload to Cloudinary
    let profilePhoto;
    try {
      profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);
      if (!profilePhoto?.url) {
        throw new ApiError(500, "Cloudinary did not return a valid URL");
      }
      console.log("Profile Photo uploaded to Cloudinary:", profilePhoto.url);
    } catch (error) {
      console.log("Cloudinary upload error:", error);
      throw new ApiError(500, "Failed to upload Profile Photo");
    }

    const newUser = await User.create({
      name,
      email,
      password,
      profilePhoto: profilePhoto.url,
    });

    const { accessTokens, refreshTokens } =
      await generateAccessAndRefreshTokens(newUser._id);

    newUser.accessTokens = accessTokens;
    newUser.refreshTokens = refreshTokens;
    await newUser.save({ validateBeforeSave: false });

    const createdUser = await User.findById(newUser._id).select(
      "-password -passwordResetToken -passwordResetExpires",
    );

    if (!createdUser) {
      throw new ApiError(500, "Unable to create User");
    }

    res.status(201).json(
      new ApiResponse(201, {
        message: "User Registered Successfully",
        user: createdUser,
      }),
    );
  } catch (error) {
    console.error("Error in registerUser:", error);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if ([email, password].some((field) => !field?.trim())) {
      throw new ApiError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "Invalid Email or Password");
    }
    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid Email or Password");
    }

    const { accessTokens, refreshTokens } =
      await generateAccessAndRefreshTokens(user._id);

    user.accessTokens = accessTokens;
    user.refreshTokens = refreshTokens;
    await user.save({ validateBeforeSave: false });
    const loggedInUser = await User.findById(user._id).select(
      "-password -passwordResetToken -passwordResetExpires",
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res
      .cookie("refreshToken", refreshTokens, options)
      .cookie("accessToken", accessTokens, options)
      .status(200)
      .json(
        new ApiResponse(200, {
          message: "User Logged In Successfully",
          user: loggedInUser,
        }),
      );
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res
    .status(error.statusCode || 500)
    .json(new ApiResponse(500 , null,"email or password is incorrect"));
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshTokens: null,
      },
    },
    {
      returnDocument: "after",
    },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -passwordResetToken -passwordResetExpires",
  );

  const data = {
    name: user.name,
    email: user.email,
    profilePhoto :user.profilePhoto 
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Current User Fetched Successfully"));
});

const updateDetails = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new ApiError(400, "Atleast one field is required to update details");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        name,
        email,
      },
    },
    {
      new: true,
    },
  ).select("-password -passwordResetToken -passwordResetExpires");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User details updated succesfully"),
    );
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
  const profilePhotoLocalPath = req.file?.path;
  if (!profilePhotoLocalPath) {
    throw new ApiError(400, "Profile Photo is required");
  }

  const profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);

  if (!profilePhoto?.url) {
    throw new ApiError(500, "Cloudinary did not return a valid URL");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        profilePhoto: profilePhoto.url,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("-password -passwordResetToken -passwordResetExpires");

  if (!updatedUser) {
    throw new ApiError(500, "Unable to update profile photo");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile Photo Updated Successfully"),
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    throw new ApiError(400, "feilds is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User with this email does not exist");
  }
  const isPasswordValid = await user.isPasswordValid(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successfully. You can now log in with your new password.",
      ),
    );
});





export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateDetails,
  updateProfilePhoto,
  forgotPassword,
};
