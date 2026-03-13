import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(
      "You are not logged in! Please log in to get access.",
      401
    );
  }
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const candidate = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!candidate) {
      throw new ApiError(
        "The user belonging to this token does no longer exist.",
        401
      );
    }

    req.user = candidate;
    next();
  } catch (error) {
    throw new ApiError(error?.message || "Invalid access Token", 401);
  }
});


























