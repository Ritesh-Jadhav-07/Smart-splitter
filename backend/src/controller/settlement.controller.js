import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js";

import settlementService from "../services/settlement.services.js";

class SettlementController {

  /**
   * Create Settlement Request
   */
  createSettlement = asyncHandler(async (req, res) => {

    const settlement = await settlementService.createSettlement({

      ...req.body,

      createdBy: req.user._id,

    });

    return res.status(201).json(

      new ApiResponse(

        201,

        settlement,

        "Settlement request created successfully."

      )

    );

  });

  /**
   * Accept Settlement
   */
  acceptSettlement = asyncHandler(async (req, res) => {

    const { settlementId } = req.params;

    const settlement = await settlementService.acceptSettlement(

      settlementId,

      req.user._id

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        settlement,

        "Settlement accepted successfully."

      )

    );

  });

  /**
   * Reject Settlement
   */
  rejectSettlement = asyncHandler(async (req, res) => {

    const { settlementId } = req.params;

    const settlement = await settlementService.rejectSettlement(

      settlementId,

      req.user._id

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        settlement,

        "Settlement rejected successfully."

      )

    );

  });

  /**
   * Cancel Settlement
   */
  cancelSettlement = asyncHandler(async (req, res) => {

    const { settlementId } = req.params;

    const settlement = await settlementService.cancelSettlement(

      settlementId,

      req.user._id

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        settlement,

        "Settlement cancelled successfully."

      )

    );

  });

  /**
   * Pending Settlements
   */
  getPendingSettlements = asyncHandler(async (req, res) => {

    const settlements = await settlementService.getPendingSettlements(

      req.user._id

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        settlements,

        "Pending settlements fetched successfully."

      )

    );

  });

  /**
   * Settlement History
   */
  getSettlementHistory = asyncHandler(async (req, res) => {

    const { groupId } = req.params;

    const settlements = await settlementService.getSettlementHistory(

      groupId

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        settlements,

        "Settlement history fetched successfully."

      )

    );

  });

}

export default new SettlementController();