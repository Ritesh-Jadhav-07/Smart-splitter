import { ApiError } from "../utils/api-error.js";
import { SPLIT_TYPES } from "../constants/expense.constants.js";

class ExpenseService {

    static validatePayers(paidBy, totalAmount) {

        if (!paidBy || paidBy.length === 0) {
            throw new ApiError(400, "At least one payer is required.");
        }

        const totalPaid = paidBy.reduce(
            (sum, payer) => sum + payer.amount,
            0
        );

        if (totalPaid !== totalAmount) {
            throw new ApiError(
                400,
                "Total paid amount must equal total expense amount."
            );
        }

        const payerIds = paidBy.map(
            payer => payer.user.toString()
        );

        if (new Set(payerIds).size !== payerIds.length) {
            throw new ApiError(
                400,
                "Duplicate payers are not allowed."
            );
        }
    }

    static validateParticipants(participants) {

        if (!participants || participants.length === 0) {
            throw new ApiError(
                400,
                "At least one participant is required."
            );
        }

        const participantIds = participants.map(
            participant => participant.user.toString()
        );

        if (new Set(participantIds).size !== participantIds.length) {
            throw new ApiError(
                400,
                "Duplicate participants are not allowed."
            );
        }
    }

    static validatePayersExistInParticipants(
        paidBy,
        participants
    ) {

        const participantSet = new Set(
            participants.map(
                participant => participant.user.toString()
            )
        );

        for (const payer of paidBy) {

            if (!participantSet.has(payer.user.toString())) {

                throw new ApiError(
                    400,
                    "Every payer must also be a participant."
                );

            }

        }

    }

    static calculateEqualShares(totalAmount, participants) {

        const share = Number(
            (totalAmount / participants.length).toFixed(2)
        );

        return participants.map(participant => ({
            ...participant,
            share
        }));

    }

    static validateExpense(data) {

        const {
            totalAmount,
            splitType,
            paidBy,
            participants
        } = data;

        this.validatePayers(
            paidBy,
            totalAmount
        );

        this.validateParticipants(
            participants
        );

        this.validatePayersExistInParticipants(
            paidBy,
            participants
        );

        if (splitType === SPLIT_TYPES.EQUAL) {

            data.participants =
                this.calculateEqualShares(
                    totalAmount,
                    participants
                );

        }

        return data;

    }

}

export default ExpenseService;