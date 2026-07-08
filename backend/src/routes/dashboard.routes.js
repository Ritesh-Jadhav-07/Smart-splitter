import { Router } from "express";

import dashboardController from "../controller/dashboard.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

// All dashboard routes require authentication
router.use(verifyJWT);

/**
 * Dashboard Summary
 */
router.get(
  "/",
  dashboardController.getDashboard
);

export default router;