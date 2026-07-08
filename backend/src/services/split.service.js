import { ApiError } from "../utils/api-error.js";
import { SPLIT_TYPES } from "../constants/expense.constants.js";

class SplitService {
  /**
   * Round to 2 decimal places
   */
  round(value) {
    return Number(Number(value).toFixed(2));
  }

  /**
   * Validate participants
   */
  validateParticipants(participants) {
    if (!participants || participants.length < 2) {
      throw new ApiError(
        400,
        "At least two participants are required."
      );
    }
  }

  /**
   * Equal Split
   */
  calculateEqualSplit(totalAmount, participants) {
    this.validateParticipants(participants);

    const totalParticipants = participants.length;

    const equalShare = this.round(
      totalAmount / totalParticipants
    );

    let assigned = 0;

    const updatedParticipants = participants.map(
      (participant, index) => {
        let share;

        if (index === totalParticipants - 1) {
          share = this.round(totalAmount - assigned);
        } else {
          share = equalShare;
          assigned += equalShare;
        }

        return {
          ...participant,
          share,
          percentage: 0,
        };
      }
    );

    return updatedParticipants;
  }

  /**
   * Exact Split
   */
  calculateExactSplit(totalAmount, participants) {
    this.validateParticipants(participants);

    const totalShare = this.round(
      participants.reduce(
        (sum, participant) =>
          sum + Number(participant.share || 0),
        0
      )
    );

    if (totalShare !== this.round(totalAmount)) {
      throw new ApiError(
        400,
        "Sum of shares must equal total amount."
      );
    }

    return participants.map((participant) => ({
      ...participant,
      share: this.round(participant.share),
      percentage: 0,
    }));
  }

  /**
   * Unequal Split
   * (Same as Exact, but kept separate for future customization)
   */
  calculateUnequalSplit(totalAmount, participants) {
    this.validateParticipants(participants);

    const totalShare = this.round(
      participants.reduce(
        (sum, participant) =>
          sum + Number(participant.share || 0),
        0
      )
    );

    if (totalShare !== this.round(totalAmount)) {
      throw new ApiError(
        400,
        "Sum of shares must equal total amount."
      );
    }

    return participants.map((participant) => ({
      ...participant,
      share: this.round(participant.share),
      percentage: 0,
    }));
  }

  /**
   * Percentage Split
   */
  calculatePercentageSplit(totalAmount, participants) {
    this.validateParticipants(participants);

    const totalPercentage = this.round(
      participants.reduce(
        (sum, participant) =>
          sum + Number(participant.percentage || 0),
        0
      )
    );

    if (totalPercentage !== 100) {
      throw new ApiError(
        400,
        "Total percentage must be exactly 100."
      );
    }

    let assigned = 0;

    const updatedParticipants = participants.map(
      (participant, index) => {
        let share;

        if (index === participants.length - 1) {
          share = this.round(totalAmount - assigned);
        } else {
          share = this.round(
            (totalAmount * participant.percentage) /
              100
          );

          assigned += share;
        }

        return {
          ...participant,
          share,
        };
      }
    );

    return updatedParticipants;
  }

  /**
   * Main Split Method
   */
  calculateSplit(
    splitType,
    totalAmount,
    participants
  ) {
    switch (splitType) {
      case SPLIT_TYPES.EQUAL:
        return this.calculateEqualSplit(
          totalAmount,
          participants
        );

      case SPLIT_TYPES.EXACT:
        return this.calculateExactSplit(
          totalAmount,
          participants
        );

      case SPLIT_TYPES.UNEQUAL:
        return this.calculateUnequalSplit(
          totalAmount,
          participants
        );

      case SPLIT_TYPES.PERCENTAGE:
        return this.calculatePercentageSplit(
          totalAmount,
          participants
        );

      default:
        throw new ApiError(
          400,
          "Invalid split type."
        );
    }
  }
}

export default new SplitService();