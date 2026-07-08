import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js";

import expenseService from "../services/expense.service.js";

class ExpenseController {

    /**
     * Create Expense
     */
    createExpense = asyncHandler(async (req, res) => {

        const expense = await expenseService.createExpense({

            ...req.body,

            createdBy: req.user._id,

        });

        return res.status(201).json(

            new ApiResponse(

                201,

                expense,

                "Expense created successfully."

            )

        );

    });

    /**
     * Get Expense By Id
     */
    getExpenseById = asyncHandler(async (req, res) => {

        const expense = await expenseService.getExpenseById(

            req.params.expenseId,

            req.user._id

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                expense,

                "Expense fetched successfully."

            )

        );

    });

    /**
     * Get My Expenses
     */
    getMyExpenses = asyncHandler(async (req, res) => {

        const expenses = await expenseService.getMyExpenses(

            req.user._id

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                expenses,

                "Expenses fetched successfully."

            )

        );

    });
    /**
     * Get Expenses Of Group
     */
    getGroupExpenses = asyncHandler(async (req, res) => {

        const expenses = await expenseService.getGroupExpenses(

            req.params.groupId,

            req.user._id

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                expenses,

                "Group expenses fetched successfully."

            )

        );

    });

    /**
     * Update Expense
     */
    updateExpense = asyncHandler(async (req, res) => {

        const expense = await expenseService.updateExpense(

            req.params.expenseId,

            req.body,

            req.user._id

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                expense,

                "Expense updated successfully."

            )

        );

    });

    /**
     * Delete Expense
     */
    deleteExpense = asyncHandler(async (req, res) => {

        const result = await expenseService.deleteExpense(

            req.params.expenseId,

            req.user._id

        );

        return res.status(200).json(

            new ApiResponse(

                200,

                result,

                "Expense deleted successfully."

            )

        );

    });

}

export default new ExpenseController();