import { Group } from "../models/group.model.js";
import { User } from "../models/user.js";
import { ApiError } from "../utils/api-error.js";

class ValidationService {
  /**
   * Validate Expense Title
   */
  validateTitle(title) {
    if (!title || !title.trim()) {
      throw new ApiError(400, "Expense title is required.");
    }
  }

  /**
   * Validate Amount
   */
  validateAmount(amount) {
    if (amount <= 0) {
      throw new ApiError(
        400,
        "Total amount must be greater than zero."
      );
    }
  }

  /**
   * Validate Participants
   */
  validateParticipants(participants) {
    if (!participants || participants.length < 2) {
      throw new ApiError(
        400,
        "At least two participants are required."
      );
    }

    const ids = participants.map((p) => p.user.toString());

    if (new Set(ids).size !== ids.length) {
      throw new ApiError(
        400,
        "Duplicate participants are not allowed."
      );
    }
  }

  /**
   * Validate Payers
   */
  validatePayers(paidBy) {
    if (!paidBy || paidBy.length === 0) {
      throw new ApiError(
        400,
        "At least one payer is required."
      );
    }

    const ids = paidBy.map((payer) => payer.user.toString());

    if (new Set(ids).size !== ids.length) {
      throw new ApiError(
        400,
        "Duplicate payers are not allowed."
      );
    }
  }

  /**
   * Validate Total Paid
   */
  validateTotalPaid(totalAmount, paidBy) {
    const totalPaid = Number(
      paidBy
        .reduce((sum, payer) => sum + Number(payer.amount), 0)
        .toFixed(2)
    );

    if (totalPaid !== Number(totalAmount.toFixed(2))) {
      throw new ApiError(
        400,
        "Total paid amount must equal total expense amount."
      );
    }
  }

  /**
   * Validate Group
   */
  async validateGroup(groupId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    return group;
  }

  /**
   * Validate Creator
   */
  async validateCreator(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return user;
  }

  /**
   * Validate Creator is Group Member
   */
  validateCreatorInGroup(group, userId) {
    const isMember = group.members.some(
      (member) =>
        member.user.toString() === userId.toString()
    );

    if (!isMember) {
      throw new ApiError(
        403,
        "You are not a member of this group."
      );
    }
  }

  /**
   * Validate All Participants Belong To Group
   */
  validateParticipantsInGroup(group, participants) {
    const members = group.members.map((member) =>
      member.user.toString()
    );

    for (const participant of participants) {
      if (!members.includes(participant.user.toString())) {
        throw new ApiError(
          400,
          "Participant is not a member of this group."
        );
      }
    }
  }

  /**
   * Validate All Payers Belong To Group
   */
  validatePayersInGroup(group, paidBy) {
    const members = group.members.map((member) =>
      member.user.toString()
    );

    for (const payer of paidBy) {
      if (!members.includes(payer.user.toString())) {
        throw new ApiError(
          400,
          "Payer is not a member of this group."
        );
      }
    }
  }

  /**
   * Validate Every Payer Is Participant
   */
  validatePayerParticipant(participants, paidBy) {
    const participantIds = participants.map((participant) =>
      participant.user.toString()
    );

    for (const payer of paidBy) {
      if (!participantIds.includes(payer.user.toString())) {
        throw new ApiError(
          400,
          "Every payer must also be a participant."
        );
      }
    }
  }
}

export default new ValidationService();