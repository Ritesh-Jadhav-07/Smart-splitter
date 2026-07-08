import { Router } from "express";

import expenseController from "../controller/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All expense routes require authentication
router.use(verifyJWT);

/**
 * Create Expense
 */
router.post(
  "/",
  expenseController.createExpense
);

/**
 * Logged-in User Expenses
 */
router.get(
  "/my-expenses",
  expenseController.getMyExpenses
);

/**
 * Group Expenses
 */
router.get(
  "/group/:groupId",
  expenseController.getGroupExpenses
);

/**
 * Get Expense By Id
 */
router.get(
  "/:expenseId",
  expenseController.getExpenseById
);

/**
 * Update Expense
 */
router.put(
  "/:expenseId",
  expenseController.updateExpense
);

/**
 * Delete Expense
 */
router.delete(
  "/:expenseId",
  expenseController.deleteExpense
);

export default router;