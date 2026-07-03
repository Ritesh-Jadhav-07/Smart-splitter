import mongoose from "mongoose";
import { GROUP_ROLES } from "../constants/expense.constants.js";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(GROUP_ROLES),
      default: GROUP_ROLES.MEMBER,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    members: {
      type: [memberSchema],
      validate: {
        validator: (members) => members.length >= 2,
        message: "A group must have at least two members.",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    groupPhoto: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model("Group", groupSchema);