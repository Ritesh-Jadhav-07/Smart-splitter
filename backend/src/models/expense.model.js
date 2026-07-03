import mongoose from "mongoose";

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
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Amount this participant owes
    share: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Used only when splitType = PERCENTAGE
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
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
      enum: ["EQUAL", "EXACT", "PERCENTAGE"],
      required: true,
    },

    // null means one-to-one expense
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
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
        validator: (value) => value.length > 0,
        message: "At least one participant is required.",
      },
    },

    category: {
      type: String,
      default: "Other",
    },

    notes: {
      type: String,
      default: "",
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

export const Expense = mongoose.model("Expense", expenseSchema);