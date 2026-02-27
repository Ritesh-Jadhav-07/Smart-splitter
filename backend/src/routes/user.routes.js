import { Router } from "express";
import { registerUser , loginUser } from "../controller/auth.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

router
  .route("/register")
  .post(upload.fields([{ name: "profilePhoto", maxCount: 1 }]), registerUser);

router.route("/login").post(loginUser);

export default router;
