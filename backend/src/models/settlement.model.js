import mongoose from "mongoose";
import { SETTLEMENT_STATUS } from "../constants/expense.constants.js";

const settlementSchema = new mongoose.Schema(
  {
    // User who claims to have paid
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User who should confirm
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Every settlement belongs to a group
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // FULL or PARTIAL
    settlementType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(SETTLEMENT_STATUS),
      default: SETTLEMENT_STATUS.PENDING,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    settlementDate: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

settlementSchema.index({ group: 1 });

settlementSchema.index({ from: 1 });

settlementSchema.index({ to: 1 });

settlementSchema.index({ status: 1 });

settlementSchema.index({
  group: 1,
  status: 1,
});

export const Settlement = mongoose.model(
  "Settlement",
  settlementSchema
);