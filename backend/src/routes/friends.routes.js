import { Router } from "express";
import {
    searchUser,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
} from "../controller/friend.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();


router.route("/search").get(verifyJWT, searchUser);
router.route("/send-request/:receiverId").post(verifyJWT, sendFriendRequest);
router.route("/requests").get(verifyJWT, getPendingRequests);
router.route("/accept-request/:requestId").post(verifyJWT, acceptFriendRequest);
router.route("/reject-request/:requestId").post(verifyJWT, rejectFriendRequest);
router.route("/friends").get(verifyJWT, getFriends);

export default router;