import mongoose from "mongoose";
import {
  SPLIT_TYPES,
  EXPENSE_CATEGORIES,
} from "../constants/expense.constants.js";

const payerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    share: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    _id: false,
  }
);

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    splitType: {
      type: String,
      enum: Object.values(SPLIT_TYPES),
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    paidBy: {
      type: [payerSchema],
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one payer is required.",
      },
    },

    participants: {
      type: [participantSchema],
      validate: {
        validator: (value) => value.length >= 2,
        message: "At least two participants are required.",
      },
    },

    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: "Other",
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expenseDate: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
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

expenseSchema.index({ group: 1 });

expenseSchema.index({ createdBy: 1 });

expenseSchema.index({ expenseDate: -1 });

expenseSchema.index({ "participants.user": 1 });

expenseSchema.index({ "paidBy.user": 1 });

export const Expense = mongoose.model(
  "Expense",
  expenseSchema
);