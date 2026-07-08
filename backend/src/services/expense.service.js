import mongoose from "mongoose";
import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";

import splitService from "./split.service.js";
import validationService from "./validation.service.js";

import { ApiError } from "../utils/api-error.js";

class ExpenseService {
  /**
   * Validate Complete Expense Data
   */
  async validateExpenseData(expenseData) {
    const {
      title,
      totalAmount,
      splitType,
      group,
      paidBy,
      participants,
      createdBy,
    } = expenseData;

    //--------------------------------------------------
    // Basic Validation
    //--------------------------------------------------

    validationService.validateTitle(title);

    validationService.validateAmount(totalAmount);

    validationService.validateParticipants(participants);

    validationService.validatePayers(paidBy);

    validationService.validateTotalPaid(totalAmount, paidBy);

    //--------------------------------------------------
    // Validate Creator
    //--------------------------------------------------

    await validationService.validateCreator(createdBy);

    //--------------------------------------------------
    // Validate Group
    //--------------------------------------------------

    const groupDoc = await validationService.validateGroup(group);

    //--------------------------------------------------
    // Membership Validation
    //--------------------------------------------------

    validationService.validateCreatorInGroup(groupDoc, createdBy);

    validationService.validateParticipantsInGroup(groupDoc, participants);

    validationService.validatePayersInGroup(groupDoc, paidBy);

    validationService.validatePayerParticipant(participants, paidBy);

    //--------------------------------------------------
    // Calculate Split
    //--------------------------------------------------

    return splitService.calculateSplit(splitType, totalAmount, participants);
  }

  /**
   * Create Expense
   */
  async createExpense(expenseData) {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        title,
        description,
        totalAmount,
        splitType,
        group,

        paidBy,

        participants,

        category,

        currency,

        notes,

        createdBy,

        expenseDate,
      } = expenseData;

      //--------------------------------------------------
      // Basic Validation
      //--------------------------------------------------

      const updatedParticipants = await this.validateExpenseData(expenseData);

      //--------------------------------------------------
      // Calculate Split
      //--------------------------------------------------

      //--------------------------------------------------
      // Create Expense
      //--------------------------------------------------

      const [expense] = await Expense.create(
        [
          {
            title,
            description,
            totalAmount,

            splitType,

            group,

            paidBy,

            participants: updatedParticipants,

            category,

            currency,

            notes,

            createdBy,

            expenseDate,
          },
        ],
        {
          session,
        },
      );

      //--------------------------------------------------
      // Commit Transaction
      //--------------------------------------------------

      await session.commitTransaction();

      return expense;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get Expense By Id
   */
  async getExpenseById(expenseId, userId) {
    const expense = await Expense.findOne({
      _id: expenseId,

      isDeleted: false,
    })
      .populate("createdBy", "name email profilePhoto")
      .populate("group", "name")
      .populate("paidBy.user", "name email profilePhoto")
      .populate("participants.user", "name email profilePhoto");

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    //--------------------------------------------------
    // Verify User Belongs To Group
    //--------------------------------------------------

    const group = await Group.findById(expense.group._id);

    const isMember = group.members.some(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!isMember) {
      throw new ApiError(403, "You are not authorized to access this expense.");
    }

    return expense;
  }

  /**
   * Get Logged-in User Expenses
   */
  async getMyExpenses(userId) {
    const groups = await Group.find({
      "members.user": userId,

      isActive: true,
    }).select("_id");

    const groupIds = groups.map((group) => group._id);

    const expenses = await Expense.find({
      group: {
        $in: groupIds,
      },

      isDeleted: false,
    })
      .populate("createdBy", "name email profilePhoto")
      .populate("group", "name")
      .populate("paidBy.user", "name email profilePhoto")
      .populate("participants.user", "name email profilePhoto")
      .sort({
        expenseDate: -1,
        createdAt: -1,
      });

    return expenses;
  }
  /**
   * Get Expenses Of A Group
   */
  async getGroupExpenses(groupId, userId) {
    //--------------------------------------------------
    // Validate Group
    //--------------------------------------------------

    const group = await validationService.validateGroup(groupId);

    validationService.validateCreatorInGroup(group, userId);

    //--------------------------------------------------
    // Fetch Expenses
    //--------------------------------------------------

    const expenses = await Expense.find({
      group: groupId,

      isDeleted: false,
    })
      .populate("createdBy", "name email profilePhoto")
      .populate("group", "name")
      .populate("paidBy.user", "name email profilePhoto")
      .populate("participants.user", "name email profilePhoto")
      .sort({
        expenseDate: -1,
        createdAt: -1,
      });

    return expenses;
  }

  /**
   * Update Expense
   */
  async updateExpense(expenseId, expenseData, userId) {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
      const expense = await Expense.findOne({
        _id: expenseId,

        isDeleted: false,
      });

      if (!expense) {
        throw new ApiError(404, "Expense not found.");
      }

      //--------------------------------------------------
      // Only creator can update
      //--------------------------------------------------

      if (expense.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "Only creator can update this expense.");
      }

      //--------------------------------------------------
      // Merge Existing + New Data
      //--------------------------------------------------

      const updatedExpense = {
        ...expense.toObject(),

        ...expenseData,
      };

      //--------------------------------------------------
      // Recalculate Split
      //--------------------------------------------------

      updatedExpense.createdBy = expense.createdBy;

      const updatedParticipants =
        await this.validateExpenseData(updatedExpense);

      updatedExpense.participants = updatedParticipants;

      //--------------------------------------------------
      // Save
      //--------------------------------------------------

      Object.assign(expense, updatedExpense);

      await expense.save({ session });

      await session.commitTransaction();

      return expense;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete Expense
   */
  async deleteExpense(expenseId, userId) {
    const expense = await Expense.findOne({
      _id: expenseId,

      isDeleted: false,
    });

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    //--------------------------------------------------
    // Only creator can delete
    //--------------------------------------------------

    if (expense.createdBy.toString() !== userId.toString()) {
      throw new ApiError(403, "Only creator can delete this expense.");
    }

    expense.isDeleted = true;

    await expense.save();

    return {
      message: "Expense deleted successfully.",
    };
  }

  /**
   * Update Expense
   */
  async updateExpense(expenseId, expenseData, userId) {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
      const expense = await Expense.findById(expenseId);

      if (!expense || expense.isDeleted) {
        throw new ApiError(404, "Expense not found.");
      }

      //--------------------------------------------------
      // Only Creator Can Update
      //--------------------------------------------------

      if (expense.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "Only creator can update this expense.");
      }

      //--------------------------------------------------
      // Extract Updated Values
      //--------------------------------------------------

      const {
        title = expense.title,

        description = expense.description,

        totalAmount = expense.totalAmount,

        splitType = expense.splitType,

        paidBy = expense.paidBy,

        participants = expense.participants,

        category = expense.category,

        currency = expense.currency,

        notes = expense.notes,

        expenseDate = expense.expenseDate,
      } = expenseData;

      //--------------------------------------------------
      // Validate Amount
      //--------------------------------------------------

      if (totalAmount <= 0) {
        throw new ApiError(400, "Amount must be greater than zero.");
      }

      //--------------------------------------------------
      // Validate Participants
      //--------------------------------------------------

      if (!participants.length) {
        throw new ApiError(400, "Participants are required.");
      }

      //--------------------------------------------------
      // Validate Paid By
      //--------------------------------------------------

      if (!paidBy.length) {
        throw new ApiError(400, "Payer information is required.");
      }

      //--------------------------------------------------
      // Duplicate Participants
      //--------------------------------------------------

      const participantIds = participants.map((participant) =>
        participant.user.toString(),
      );

      if (new Set(participantIds).size !== participantIds.length) {
        throw new ApiError(400, "Duplicate participants found.");
      }

      //--------------------------------------------------
      // Duplicate Payers
      //--------------------------------------------------

      const payerIds = paidBy.map((payer) => payer.user.toString());

      if (new Set(payerIds).size !== payerIds.length) {
        throw new ApiError(400, "Duplicate payers found.");
      }

      //--------------------------------------------------
      // Total Paid
      //--------------------------------------------------

      const totalPaid = paidBy.reduce(
        (sum, payer) => sum + payer.amount,

        0,
      );

      if (Number(totalPaid.toFixed(2)) !== Number(totalAmount.toFixed(2))) {
        throw new ApiError(
          400,

          "Total paid amount must equal expense amount.",
        );
      }
      //--------------------------------------------------
      // Recalculate Split
      //--------------------------------------------------

      let splitResult;

      switch (splitType) {
        case "EQUAL":
          splitResult = splitService.calculateEqualSplit(
            totalAmount,
            participants,
          );

          break;

        case "EXACT":

        case "UNEQUAL":
          splitResult = splitService.calculateExactSplit(
            totalAmount,
            participants,
          );

          break;

        case "PERCENTAGE":
          splitResult = splitService.calculatePercentageSplit(
            totalAmount,
            participants,
          );

          break;

        default:
          throw new ApiError(400, "Invalid split type.");
      }

      //--------------------------------------------------
      // Update Expense
      //--------------------------------------------------

      expense.title = title;

      expense.description = description;

      expense.totalAmount = totalAmount;

      expense.splitType = splitType;

      expense.paidBy = paidBy;

      expense.participants = splitResult.participants;

      expense.category = category;

      expense.currency = currency;

      expense.notes = notes;

      expense.expenseDate = expenseDate;

      await expense.save({ session });

      //--------------------------------------------------
      // Commit Transaction
      //--------------------------------------------------

      await session.commitTransaction();

      //--------------------------------------------------
      // Return Updated Expense
      //--------------------------------------------------

      return await Expense.findById(expense._id)
        .populate("createdBy", "name email profilePhoto")
        .populate("paidBy.user", "name email profilePhoto")
        .populate("participants.user", "name email profilePhoto")
        .populate("group", "name description");
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default new ExpenseService();
