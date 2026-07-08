import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js";

import dashboardService from "../services/dashboard.service.js";

class DashboardController {

  /**
   * Get Dashboard
   */
  getDashboard = asyncHandler(async (req, res) => {

    const dashboard = await dashboardService.getDashboard(

      req.user._id

    );

    return res.status(200).json(

      new ApiResponse(

        200,

        dashboard,

        "Dashboard fetched successfully."

      )

    );

  });

}

export default new DashboardController();