import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js";
import ExpenseService from "../services/expense.service.js";
import { Expense } from "../models/expense.model.js";

export const createExpense = asyncHandler(async (req, res) => {

    const validatedExpense =
        ExpenseService.validateExpense(req.body);

    const expense = await Expense.create({
        ...validatedExpense,
        createdBy: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            expense,
            "Expense created successfully."
        )
    );

});