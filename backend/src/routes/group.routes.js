import { Router } from "express";

import groupController from "../controller/group.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

/**
 * Group CRUD
 */
router.post(
  "/",
  groupController.createGroup
);

router.get(
  "/",
  groupController.getMyGroups
);

router.get(
  "/:groupId",
  groupController.getGroupById
);

router.put(
  "/:groupId",
  groupController.updateGroup
);

router.delete(
  "/:groupId",
  groupController.deleteGroup
);

/**
 * Members
 */
router.post(
  "/:groupId/members",
  groupController.addMembers
);

router.delete(
  "/:groupId/members/:userId",
  groupController.removeMember
);

/**
 * Admin
 */
router.patch(
  "/:groupId/admin/:userId",
  groupController.makeAdmin
);

/**
 * Leave Group
 */
router.post(
  "/:groupId/leave",
  groupController.leaveGroup
);

export default router;