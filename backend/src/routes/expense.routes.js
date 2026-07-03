import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createExpense } from "../controller/expense.controller.js";

const router = Router();

router.post("/", verifyJWT, createExpense);

export default router;