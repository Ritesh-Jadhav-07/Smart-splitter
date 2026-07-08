class MinCashFlowService {

  /**
   * Round value to 2 decimal places
   */
  round(value) {
    return Number(Number(value).toFixed(2));
  }

  /**
   * Calculate net balance of every member
   *
   * +ve -> should receive
   * -ve -> should pay
   */
  calculateNetBalances(expenses) {

    const balances = new Map();

    for (const expense of expenses) {

      //------------------------------------
      // Money Paid
      //------------------------------------

      for (const payer of expense.paidBy) {

        const userId = payer.user.toString();

        balances.set(

          userId,

          this.round(
            (balances.get(userId) || 0)
            + payer.amount
          )

        );

      }

      //------------------------------------
      // Money Owed
      //------------------------------------

      for (const participant of expense.participants) {

        const userId = participant.user.toString();

        balances.set(

          userId,

          this.round(
            (balances.get(userId) || 0)
            - participant.share
          )

        );

      }

    }

    return balances;

  }

  /**
   * Separate creditors & debtors
   */
  separateBalances(balances) {

    const creditors = [];

    const debtors = [];

    for (const [user, amount] of balances.entries()) {

      if (amount > 0.01) {

        creditors.push({

          user,

          amount: this.round(amount)

        });

      }

      else if (amount < -0.01) {

        debtors.push({

          user,

          amount: this.round(Math.abs(amount))

        });

      }

    }

    creditors.sort((a, b) => b.amount - a.amount);

    debtors.sort((a, b) => b.amount - a.amount);

    return {

      creditors,

      debtors

    };

  }
  /**
   * Greedy Minimum Cash Flow Algorithm
   *
   * Returns minimum number of transactions
   */
  minimizeCashFlow(balances) {

    const { creditors, debtors } =
      this.separateBalances(balances);

    const transactions = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (
      creditorIndex < creditors.length &&
      debtorIndex < debtors.length
    ) {

      const creditor = creditors[creditorIndex];

      const debtor = debtors[debtorIndex];

      const settledAmount = this.round(
        Math.min(
          creditor.amount,
          debtor.amount
        )
      );

      transactions.push({

        from: debtor.user,

        to: creditor.user,

        amount: settledAmount,

      });

      creditor.amount = this.round(
        creditor.amount - settledAmount
      );

      debtor.amount = this.round(
        debtor.amount - settledAmount
      );

      if (creditor.amount <= 0.01) {
        creditorIndex++;
      }

      if (debtor.amount <= 0.01) {
        debtorIndex++;
      }

    }

    return transactions;

  }

  /**
   * Apply completed settlements
   *
   * COMPLETED settlements reduce the pending
   * settlement suggestions.
   */
  applyCompletedSettlements(
    transactions,
    settlements
  ) {

    if (!settlements.length) {
      return transactions;
    }

    for (const settlement of settlements) {

      if (settlement.status !== "COMPLETED") {
        continue;
      }

      const transaction = transactions.find(

        (t) =>

          t.from.toString() ===
            settlement.from.toString()

          &&

          t.to.toString() ===
            settlement.to.toString()

      );

      if (!transaction) {
        continue;
      }

      transaction.amount = this.round(

        transaction.amount -

        settlement.amount

      );

    }

    return transactions.filter(

      (transaction) =>

        transaction.amount > 0.01

    );

  }
    /**
   * Generate settlement suggestions
   */
  generateSettlementSuggestions(
    expenses,
    settlements = []
  ) {

    //--------------------------------------------------
    // Calculate balances
    //--------------------------------------------------

    const balances =
      this.calculateNetBalances(expenses);

    //--------------------------------------------------
    // Generate minimum transactions
    //--------------------------------------------------

    let transactions =
      this.minimizeCashFlow(balances);

    //--------------------------------------------------
    // Aggregate completed settlements
    //--------------------------------------------------

    const completedMap = new Map();

    for (const settlement of settlements) {

      if (settlement.status !== "COMPLETED") {
        continue;
      }

      const key =
        settlement.from.toString() +
        "-" +
        settlement.to.toString();

      completedMap.set(

        key,

        this.round(

          (completedMap.get(key) || 0)

          + settlement.amount

        )

      );

    }

    //--------------------------------------------------
    // Apply completed settlements
    //--------------------------------------------------

    transactions = transactions
      .map(transaction => {

        const key =
          transaction.from.toString() +
          "-" +
          transaction.to.toString();

        const completed =
          completedMap.get(key) || 0;

        return {

          ...transaction,

          amount: this.round(

            transaction.amount - completed

          )

        };

      })
      .filter(
        transaction =>
          transaction.amount > 0.01
      );

    return transactions;

  }

  /**
   * Get balance of one user
   */
  getUserBalance(
    userId,
    expenses,
    settlements = []
  ) {

    const suggestions =
      this.generateSettlementSuggestions(
        expenses,
        settlements
      );

    let shouldReceive = 0;

    let shouldPay = 0;

    for (const suggestion of suggestions) {

      if (
        suggestion.to.toString() ===
        userId.toString()
      ) {

        shouldReceive += suggestion.amount;

      }

      if (
        suggestion.from.toString() ===
        userId.toString()
      ) {

        shouldPay += suggestion.amount;

      }

    }

    return {

      shouldReceive:
        this.round(shouldReceive),

      shouldPay:
        this.round(shouldPay),

      netBalance:
        this.round(
          shouldReceive - shouldPay
        )

    };

  }

  /**
   * Get balances of all members
   */
  getGroupBalances(
    expenses,
    settlements = []
  ) {

    const balances =
      this.calculateNetBalances(expenses);

    const suggestions =
      this.generateSettlementSuggestions(
        expenses,
        settlements
      );

    return {

      balances,

      suggestions

    };

  }

}

export default new MinCashFlowService();