import { Router } from "express";
import { registerUser , loginUser, logoutUser,getCurrentUser , updateDetails, updateProfilePhoto, forgotPassword } from "../controller/auth.controller.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//public routes
router
  .route("/register")
  .post(upload.fields([{ name: "profilePhoto", maxCount: 1 }]), registerUser);

router.route("/login").post(loginUser);
router.route("/forget-password").post(forgotPassword); 

//private routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT , updateDetails);
router.route("/update-profile-photo").patch(verifyJWT ,upload.single("profilePhoto") , updateProfilePhoto);
export default router;
