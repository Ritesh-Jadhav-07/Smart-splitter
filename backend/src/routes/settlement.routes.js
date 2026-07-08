import { Router } from "express";

import settlementController from "../controller/settlement.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

// All settlement routes require authentication
router.use(verifyJWT);

/**
 * Create Settlement Request
 */
router.post(
  "/",
  settlementController.createSettlement
);

/**
 * Pending Settlement Requests
 */
router.get(
  "/pending",
  settlementController.getPendingSettlements
);

/**
 * Settlement History of a Group
 */
router.get(
  "/history/:groupId",
  settlementController.getSettlementHistory
);

/**
 * Accept Settlement
 */
router.patch(
  "/:settlementId/accept",
  settlementController.acceptSettlement
);

/**
 * Reject Settlement
 */
router.patch(
  "/:settlementId/reject",
  settlementController.rejectSettlement
);

/**
 * Cancel Settlement
 */
router.patch(
  "/:settlementId/cancel",
  settlementController.cancelSettlement
);

export default router;