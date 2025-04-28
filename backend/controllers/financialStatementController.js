const FinancialStatement = require("../model/FinancialStatement");
const Tax = require("../model/Tax");
const Transaction = require("../model/Transaction");

// Générer un état financier
exports.generateFinancialStatement = async (req, res) => {
  try {
    const { walletId, period, date, customTaxes } = req.body;

    if (!walletId || !period || !date) {
      return res.status(400).json({ message: "Wallet ID, period, and date are required" });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!["mensuel", "annuel"].includes(period)) {
      return res.status(400).json({ message: "Période invalide : doit être 'mensuel' ou 'annuel'" });
    }

    const startDate = new Date(date);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Date invalide" });
    }
    const endDate = new Date(startDate);
    if (period === "mensuel") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (period === "annuel") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const existingStatement = await FinancialStatement.findOne({
      wallet_id: walletId,
      date: startDate,
      type: period,
    });
    if (existingStatement) {
      return res.status(400).json({ message: "Un état financier existe déjà pour cette date et période" });
    }

    const transactions = await Transaction.find({
      wallet_id: walletId,
      date: { $gte: startDate, $lt: endDate },
    });

    const total_revenue = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const total_expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const net_profit = total_revenue - total_expenses;

    console.log("Transactions récupérées:", transactions);
    console.log("Calculs:", {
      total_revenue,
      total_expenses,
      net_profit,
      taxableTransactions: transactions.filter((t) => t.is_taxable),
    });

    const financialStatement = new FinancialStatement({
      user_id: req.user.userId,
      wallet_id: walletId,
      date: startDate,
      type: period,
      total_revenue,
      total_expenses,
      net_profit,
      taxes: [],
    });

    const taxes = [];
    let tax_generation_message = [];

    if (customTaxes && customTaxes.length > 0) {
      for (const customTax of customTaxes) {
        const amount = customTax.type === "Corporate Tax" ? net_profit * customTax.rate : total_revenue * customTax.rate;
        const tax = new Tax({
          financial_statement_id: financialStatement._id,
          type: customTax.type,
          rate: customTax.rate,
          amount: amount > 0 ? amount : 0,
        });
        await tax.save();
        taxes.push(tax);
        financialStatement.taxes.push(tax._id);
        tax_generation_message.push(
          `${customTax.type} calculée: ${amount.toFixed(2)} (taux: ${(customTax.rate * 100).toFixed(2)}%)`
        );
      }
    } else {
      const taxableRevenue = transactions
        .filter((t) => t.type === "income" && t.is_taxable && t.vat_rate > 0)
        .reduce((sum, t) => sum + (t.amount * (t.vat_rate || 0.19)), 0);
      const tvaTax = new Tax({
        financial_statement_id: financialStatement._id,
        type: "TVA",
        rate: 0.19,
        amount: taxableRevenue,
      });
      await tvaTax.save();
      taxes.push(tvaTax);
      financialStatement.taxes.push(tvaTax._id);
      if (taxableRevenue === 0) {
        tax_generation_message.push("TVA : Aucune transaction taxable trouvée ou taux TVA manquant.");
      }

      const corporateTaxAmount = net_profit > 0 ? net_profit * 0.15 : 0;
      const corporateTax = new Tax({
        financial_statement_id: financialStatement._id,
        type: "Corporate Tax",
        rate: 0.15,
        amount: corporateTaxAmount,
      });
      await corporateTax.save();
      taxes.push(corporateTax);
      financialStatement.taxes.push(corporateTax._id);
      if (corporateTaxAmount === 0) {
        tax_generation_message.push("Corporate Tax : Bénéfice net nul ou négatif.");
      }
    }

    console.log("Taxes créées:", taxes);

    await financialStatement.save();
    const populatedStatement = await FinancialStatement.findById(financialStatement._id).populate("taxes");

    res.status(201).json({
      financialStatement: populatedStatement,
      taxes,
      tax_generation_message: tax_generation_message.length > 0 ? tax_generation_message : null,
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'état financier:", error);
    res.status(500).json({ message: error.message });
  }
};

// Régénérer un état financier
exports.regenerateFinancialStatement = async (req, res) => {
  try {
    const { statementId } = req.params;
    const { customTaxes } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const financialStatement = await FinancialStatement.findById(statementId);
    if (!financialStatement) {
      return res.status(404).json({ message: "État financier non trouvé" });
    }

    if (financialStatement.user_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Non autorisé à régénérer cet état financier" });
    }

    await Tax.deleteMany({ financial_statement_id: statementId });
    await FinancialStatement.findByIdAndDelete(statementId);

    const { wallet_id, type, date } = financialStatement;
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    if (type === "mensuel") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (type === "annuel") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const transactions = await Transaction.find({
      wallet_id,
      date: { $gte: startDate, $lt: endDate },
    });

    const total_revenue = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const total_expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const net_profit = total_revenue - total_expenses;

    const newFinancialStatement = new FinancialStatement({
      user_id: req.user.userId,
      wallet_id,
      date: startDate,
      type,
      total_revenue,
      total_expenses,
      net_profit,
      taxes: [],
    });

    const taxes = [];
    let tax_generation_message = [];

    if (customTaxes && customTaxes.length > 0) {
      for (const customTax of customTaxes) {
        const amount = customTax.type === "Corporate Tax" ? net_profit * customTax.rate : total_revenue * customTax.rate;
        const tax = new Tax({
          financial_statement_id: newFinancialStatement._id,
          type: customTax.type,
          rate: customTax.rate,
          amount: amount > 0 ? amount : 0,
        });
        await tax.save();
        taxes.push(tax);
        newFinancialStatement.taxes.push(tax._id);
        tax_generation_message.push(
          `${customTax.type} calculée: ${amount.toFixed(2)} (taux: ${(customTax.rate * 100).toFixed(2)}%)`
        );
      }
    } else {
      const taxableRevenue = transactions
        .filter((t) => t.type === "income" && t.is_taxable && t.vat_rate > 0)
        .reduce((sum, t) => sum + (t.amount * (t.vat_rate || 0.19)), 0);
      const tvaTax = new Tax({
        financial_statement_id: newFinancialStatement._id,
        type: "TVA",
        rate: 0.19,
        amount: taxableRevenue,
      });
      await tvaTax.save();
      taxes.push(tvaTax);
      newFinancialStatement.taxes.push(tvaTax._id);
      if (taxableRevenue === 0) {
        tax_generation_message.push("TVA : Aucune transaction taxable trouvée ou taux TVA manquant.");
      }

      const corporateTaxAmount = net_profit > 0 ? net_profit * 0.15 : 0;
      const corporateTax = new Tax({
        financial_statement_id: newFinancialStatement._id,
        type: "Corporate Tax",
        rate: 0.15,
        amount: corporateTaxAmount,
      });
      await corporateTax.save();
      taxes.push(corporateTax);
      newFinancialStatement.taxes.push(corporateTax._id);
      if (corporateTaxAmount === 0) {
        tax_generation_message.push("Corporate Tax : Bénéfice net nul ou négatif.");
      }
    }

    await newFinancialStatement.save();
    const populatedStatement = await FinancialStatement.findById(newFinancialStatement._id).populate("taxes");

    res.status(201).json({
      financialStatement: populatedStatement,
      taxes,
      tax_generation_message: tax_generation_message.length > 0 ? tax_generation_message : null,
    });
  } catch (error) {
    console.error("Erreur lors de la régénération de l'état financier:", error);
    res.status(500).json({ message: error.message });
  }
};

// Prévoir les taxes futures
exports.forecastTaxes = async (req, res) => {
  try {
    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ message: "Wallet ID is required" });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const statements = await FinancialStatement.find({ wallet_id: walletId })
      .populate("taxes")
      .sort({ date: -1 })
      .limit(3);

    if (statements.length === 0) {
      return res.status(404).json({ message: "Aucun état financier trouvé pour la prévision" });
    }

    const avgRevenue =
      statements.reduce((sum, s) => sum + s.total_revenue, 0) / statements.length;
    const avgNetProfit =
      statements.reduce((sum, s) => sum + s.net_profit, 0) / statements.length;

    const taxTypes = [...new Set(statements.flatMap((s) => s.taxes.map((t) => t.type)))];
    const taxes = [];

    for (const type of taxTypes) {
      const rates = statements
        .flatMap((s) => s.taxes.filter((t) => t.type === type))
        .map((t) => t.rate);
      const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
      const amount = type === "Corporate Tax" ? avgNetProfit * avgRate : avgRevenue * avgRate;
      taxes.push({
        type,
        rate: avgRate,
        amount: amount > 0 ? amount : 0,
      });
    }

    res.status(200).json({ taxes });
  } catch (error) {
    console.error("Erreur lors de la prévision des taxes:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les états financiers d'un portefeuille
exports.getFinancialStatementsByWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const financialStatements = await FinancialStatement.find({ wallet_id: walletId }).populate("taxes");

    const statementsWithUpdates = await Promise.all(
      financialStatements.map(async (statement) => {
        const startDate = new Date(statement.date);
        const endDate = new Date(startDate);
        if (statement.type === "mensuel") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (statement.type === "annuel") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const newerTransactions = await Transaction.find({
          wallet_id: walletId,
          date: { $gte: startDate, $lt: endDate },
          createdAt: { $gt: statement.createdAt || statement.date },
        });

        return {
          ...statement._doc,
          hasNewerTransactions: newerTransactions.length > 0,
        };
      })
    );

    console.log("États financiers récupérés:", statementsWithUpdates);
    res.status(200).json(statementsWithUpdates);
  } catch (error) {
    console.error("Erreur lors de la récupération des états financiers:", error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un état financier
exports.deleteFinancialStatement = async (req, res) => {
  try {
    const { statementId } = req.params;
    const financialStatement = await FinancialStatement.findById(statementId);
    if (!financialStatement) {
      return res.status(404).json({ message: "État financier non trouvé" });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    if (financialStatement.user_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Non autorisé à supprimer cet état financier" });
    }
    await Tax.deleteMany({ financial_statement_id: statementId });
    await FinancialStatement.findByIdAndDelete(statementId);
    res.status(200).json({ message: "État financier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'état financier:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un état financier
exports.updateFinancialStatement = async (req, res) => {
  try {
    const { statementId } = req.params;
    const { total_revenue, total_expenses, net_profit, taxes } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const financialStatement = await FinancialStatement.findById(statementId);
    if (!financialStatement) {
      return res.status(404).json({ message: "État financier non trouvé" });
    }

    if (financialStatement.user_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Non autorisé à modifier cet état financier" });
    }

    financialStatement.total_revenue = total_revenue || financialStatement.total_revenue;
    financialStatement.total_expenses = total_expenses || financialStatement.total_expenses;
    financialStatement.net_profit = net_profit || financialStatement.net_profit;

    if (taxes && taxes.length > 0) {
      await Tax.deleteMany({ financial_statement_id: statementId });
      financialStatement.taxes = [];

      for (const tax of taxes) {
        const newTax = new Tax({
          financial_statement_id: statementId,
          type: tax.type,
          rate: tax.rate || (tax.type === "TVA" ? 0.19 : 0.15),
          amount: tax.amount,
        });
        await newTax.save();
        financialStatement.taxes.push(newTax._id);
      }
    }

    await financialStatement.save();
    const updatedStatement = await FinancialStatement.findById(statementId).populate("taxes");

    res.status(200).json({ financialStatement: updatedStatement });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'état financier:", error);
    res.status(500).json({ message: error.message });
  }
};