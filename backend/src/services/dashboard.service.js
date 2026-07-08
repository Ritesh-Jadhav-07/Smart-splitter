import { Expense } from "../models/expense.model.js";
import { Settlement } from "../models/settlement.model.js";
import { Group } from "../models/group.model.js";

import minCashFlowService from "./minCashFlow.services.js";

class DashboardService {

  /**
   * Dashboard Summary
   */
  async getDashboard(userId) {

    //--------------------------------------------------
    // User Groups
    //--------------------------------------------------

    const groups = await Group.find({

      "members.user": userId,

      isActive: true,

    });

    const dashboard = {

      totalPayable: 0,

      totalReceivable: 0,

      netBalance: 0,

      groups: [],

      pendingSettlements: [],

      recentExpenses: [],

    };

    //--------------------------------------------------
    // Process Every Group
    //--------------------------------------------------

    for (const group of groups) {

      //------------------------------------
      // Expenses
      //------------------------------------

      const expenses = await Expense.find({

        group: group._id,

        isDeleted: false,

      });

      //------------------------------------
      // Completed Settlements
      //------------------------------------

      const settlements = await Settlement.find({

        group: group._id,

        status: "COMPLETED",

      });

      //------------------------------------
      // User Balance
      //------------------------------------

      const balance =
        minCashFlowService.getUserBalance(

          userId,

          expenses,

          settlements

        );

      dashboard.totalPayable +=
        balance.shouldPay;

      dashboard.totalReceivable +=
        balance.shouldReceive;

      dashboard.groups.push({

        groupId: group._id,

        groupName: group.name,

        payable: balance.shouldPay,

        receivable: balance.shouldReceive,

        netBalance: balance.netBalance,

        suggestions:
          minCashFlowService
            .generateSettlementSuggestions(
              expenses,
              settlements
            )
            .filter(

              suggestion =>

                suggestion.from.toString() ===
                userId.toString()

                ||

                suggestion.to.toString() ===
                userId.toString()

            )

      });

    }

    //--------------------------------------------------
    // Net Balance
    //--------------------------------------------------

    dashboard.netBalance = Number(

      (
        dashboard.totalReceivable

        -

        dashboard.totalPayable

      ).toFixed(2)

    );
        //--------------------------------------------------
    // Pending Settlements
    //--------------------------------------------------

    dashboard.pendingSettlements =
      await Settlement.find({

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

    //--------------------------------------------------
    // Recent Expenses
    //--------------------------------------------------

    const groupIds = groups.map(
      group => group._id
    );

    dashboard.recentExpenses =
      await Expense.find({

        group: {
          $in: groupIds,
        },

        isDeleted: false,

      })
        .populate(
          "createdBy",
          "name profilePhoto"
        )
        .populate(
          "group",
          "name"
        )
        .sort({

          expenseDate: -1,

          createdAt: -1,

        })
        .limit(10);

    //--------------------------------------------------
    // Round Dashboard Totals
    //--------------------------------------------------

    dashboard.totalPayable = Number(
      dashboard.totalPayable.toFixed(2)
    );

    dashboard.totalReceivable = Number(
      dashboard.totalReceivable.toFixed(2)
    );

    dashboard.netBalance = Number(
      dashboard.netBalance.toFixed(2)
    );

    //--------------------------------------------------
    // Return Dashboard
    //--------------------------------------------------

    return dashboard;

  }

}

export default new DashboardService();