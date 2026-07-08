import mongoose from "mongoose";

import { Settlement } from "../models/settlement.model.js";
import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";

import minCashFlowService from "./minCashFlow.services.js";

import { ApiError } from "../utils/api-error.js";

class SettlementService {

  /**
   * Create Settlement Request
   */
  async createSettlement(data) {

    const session = await mongoose.startSession();

    session.startTransaction();

    try {

      const {

        from,
        to,
        group,
        amount,
        note,
        createdBy,

      } = data;

      //--------------------------------------------------
      // Basic Validation
      //--------------------------------------------------

      if (!amount || amount <= 0) {
        throw new ApiError(
          400,
          "Settlement amount must be greater than zero."
        );
      }

      if (from.toString() === to.toString()) {
        throw new ApiError(
          400,
          "Sender and receiver cannot be the same."
        );
      }

      //--------------------------------------------------
      // Validate Group
      //--------------------------------------------------

      const groupDoc = await Group.findById(group);

      if (!groupDoc || !groupDoc.isActive) {
        throw new ApiError(
          404,
          "Group not found."
        );
      }

      //--------------------------------------------------
      // Validate Members
      //--------------------------------------------------

      const memberIds = groupDoc.members.map(
        member => member.user.toString()
      );

      if (!memberIds.includes(from.toString())) {
        throw new ApiError(
          403,
          "Sender is not a member of the group."
        );
      }

      if (!memberIds.includes(to.toString())) {
        throw new ApiError(
          403,
          "Receiver is not a member of the group."
        );
      }

      //--------------------------------------------------
      // Fetch Expenses
      //--------------------------------------------------

      const expenses = await Expense.find({

        group,

        isDeleted: false,

      });

      //--------------------------------------------------
      // Fetch Completed Settlements
      //--------------------------------------------------

      const settlements = await Settlement.find({

        group,

        status: "COMPLETED",

      });

      //--------------------------------------------------
      // Generate Suggestions
      //--------------------------------------------------

      const suggestions =
        minCashFlowService.generateSettlementSuggestions(

          expenses,

          settlements

        );

      //--------------------------------------------------
      // Find Matching Suggestion
      //--------------------------------------------------

      const suggestion = suggestions.find(

        suggestion =>

          suggestion.from.toString() ===
          from.toString()

          &&

          suggestion.to.toString() ===
          to.toString()

      );

      if (!suggestion) {

        throw new ApiError(

          400,

          "No outstanding balance found."

        );

      }
            //--------------------------------------------------
      // Prevent Over Settlement
      //--------------------------------------------------

      if (
        Number(amount.toFixed(2)) >
        Number(suggestion.amount.toFixed(2))
      ) {
        throw new ApiError(
          400,
          `Maximum settlement amount is ₹${suggestion.amount}`
        );
      }

      //--------------------------------------------------
      // Settlement Type
      //--------------------------------------------------

      const settlementType =
        Number(amount.toFixed(2)) ===
        Number(suggestion.amount.toFixed(2))
          ? "FULL"
          : "PARTIAL";

      //--------------------------------------------------
      // Prevent Duplicate Pending Request
      //--------------------------------------------------

      const pendingSettlement = await Settlement.findOne({
        from,
        to,
        group,
        status: "PENDING",
      });

      if (pendingSettlement) {
        throw new ApiError(
          400,
          "A settlement request is already pending."
        );
      }

      //--------------------------------------------------
      // Create Settlement
      //--------------------------------------------------

      const [settlement] = await Settlement.create(
        [
          {
            from,
            to,
            group,

            amount,

            settlementType,

            note,

            createdBy,

            status: "PENDING",
          },
        ],
        {
          session,
        }
      );

      //--------------------------------------------------
      // Commit
      //--------------------------------------------------

      await session.commitTransaction();

      return settlement;

    } catch (error) {

      await session.abortTransaction();

      throw error;

    } finally {

      session.endSession();

    }

  }

  /**
   * Receiver Accepts Settlement
   */
  async acceptSettlement(
    settlementId,
    userId
  ) {

    const settlement =
      await Settlement.findById(settlementId);

    if (!settlement) {
      throw new ApiError(
        404,
        "Settlement not found."
      );
    }

    //--------------------------------------------------
    // Only receiver can accept
    //--------------------------------------------------

    if (
      settlement.to.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "Only receiver can confirm settlement."
      );
    }

    //--------------------------------------------------
    // Already Processed
    //--------------------------------------------------

    if (
      settlement.status !== "PENDING"
    ) {
      throw new ApiError(
        400,
        "Settlement already processed."
      );
    }

    settlement.status = "COMPLETED";

    settlement.confirmedAt = new Date();

    await settlement.save();

    return settlement;

  }

  /**
   * Receiver Rejects Settlement
   */
  async rejectSettlement(
    settlementId,
    userId
  ) {

    const settlement =
      await Settlement.findById(settlementId);

    if (!settlement) {
      throw new ApiError(
        404,
        "Settlement not found."
      );
    }

    //--------------------------------------------------
    // Only receiver can reject
    //--------------------------------------------------

    if (
      settlement.to.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "Only receiver can reject settlement."
      );
    }

    //--------------------------------------------------
    // Already Processed
    //--------------------------------------------------

    if (
      settlement.status !== "PENDING"
    ) {
      throw new ApiError(
        400,
        "Settlement already processed."
      );
    }

    settlement.status = "REJECTED";

    settlement.rejectedAt = new Date();

    await settlement.save();

    return settlement;

  }
    /**
   * Sender Cancels Settlement
   */
  async cancelSettlement(
    settlementId,
    userId
  ) {

    const settlement =
      await Settlement.findById(settlementId);

    if (!settlement) {
      throw new ApiError(
        404,
        "Settlement not found."
      );
    }

    //--------------------------------------------------
    // Only sender can cancel
    //--------------------------------------------------

    if (
      settlement.from.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "Only sender can cancel settlement."
      );
    }

    //--------------------------------------------------
    // Already processed
    //--------------------------------------------------

    if (
      settlement.status !== "PENDING"
    ) {
      throw new ApiError(
        400,
        "Settlement already processed."
      );
    }

    settlement.status = "CANCELLED";

    settlement.cancelledAt = new Date();

    await settlement.save();

    return settlement;

  }

  /**
   * Pending settlements received by user
   */
  async getPendingSettlements(userId) {

    return Settlement.find({

      to: userId,

      status: "PENDING",

    })
      .populate(
        "from",
        "name email profilePhoto"
      )
      .populate(
        "group",
        "name"
      )
      .sort({
        createdAt: -1,
      });

  }

  /**
   * Settlement history of a group
   */
  async getSettlementHistory(groupId) {

    return Settlement.find({

      group: groupId,

    })
      .populate(
        "from",
        "name email profilePhoto"
      )
      .populate(
        "to",
        "name email profilePhoto"
      )
      .populate(
        "createdBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

  }

}

export default new SettlementService();