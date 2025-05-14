import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaFileInvoice, FaDownload, FaEye, FaEyeSlash } from "react-icons/fa";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale } from "chart.js";
import jsPDF from "jspdf";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "../tessst/FinancialStatements.css";
import "chartjs-adapter-date-fns";

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, TimeScale);

const FinancialStatements = () => {
  const [walletData, setWalletData] = useState({ currency: "TND" });
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState("");
  const [financialStatements, setFinancialStatements] = useState([]);
  const [period, setPeriod] = useState("mensuel");
  const [statementDate, setStatementDate] = useState("");
  const [customTaxes, setCustomTaxes] = useState([{ type: "TVA", rate: 0.19 }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStatement, setEditingStatement] = useState(null);
  const [editForm, setEditForm] = useState({
    total_revenue: "",
    total_expenses: "",
    net_profit: "",
    taxes: [],
  });
  const [taxGenerationMessage, setTaxGenerationMessage] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [showTaxesTable, setShowTaxesTable] = useState({});
  const [showCharts, setShowCharts] = useState(false);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get("http://localhost:3000/users/findMyProfile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data._id;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du profil : ${error.message}`);
    }
  };

  const fetchWallet = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:3000/wallets/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du wallet : ${error.message}`);
    }
  };

  const fetchFinancialStatements = async (walletId, token) => {
    try {
      const response = await axios.get(`http://localhost:3000/financial_statements/wallet/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statementsWithTvaRate = response.data.map((statement) => ({
        ...statement,
        tvaRate: statement.taxes.find((tax) => tax.type === "TVA")?.rate || 0.19,
      }));
      setFinancialStatements(statementsWithTvaRate);
    } catch (error) {
      setError(error.message || "Erreur lors de la récupération des états financiers.");
    }
  };

  const fetchWalletData = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour voir vos états financiers.");
        return;
      }
      const userId = await fetchUserProfile(token);
      const wallet = await fetchWallet(userId, token);
      setWalletId(wallet._id);
      setWalletData({ currency: wallet.currency });
      await fetchFinancialStatements(wallet._id, token);
    } catch (error) {
      setError(error.message || "Erreur lors de la récupération des données.");
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const addCustomTax = () => {
    setCustomTaxes([...customTaxes, { type: "", rate: 0 }]);
  };

  const updateCustomTax = (index, field, value) => {
    const updatedTaxes = [...customTaxes];
    updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
    setCustomTaxes(updatedTaxes);
  };

  const removeCustomTax = (index) => {
    setCustomTaxes(customTaxes.filter((_, i) => i !== index));
  };

  const generateFinancialStatement = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError("");
    setTaxGenerationMessage(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour générer un état financier.");
        setIsGenerating(false);
        return;
      }
      if (!statementDate) {
        setError("Veuillez sélectionner une date de début.");
        setIsGenerating(false);
        return;
      }
      const payload = {
        walletId,
        period: period.toLowerCase(),
        date: statementDate,
        customTaxes: customTaxes.filter((tax) => tax.type && tax.rate > 0),
      };
      console.log("Données envoyées:", payload);
      const response = await axios.post(
        "http://localhost:3000/financial_statements/generate",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFinancialStatements([
        ...financialStatements,
        {
          ...response.data.financialStatement,
          tvaRate: customTaxes.find((tax) => tax.type === "TVA")?.rate || 0.19,
        },
      ]);
      setTaxGenerationMessage(response.data.tax_generation_message);
      setStatementDate("");
      setPeriod("mensuel");
      setCustomTaxes([{ type: "TVA", rate: 0.19 }]);
    } catch (error) {
      setError(error.response?.data?.message || "Erreur lors de la génération de l'état financier.");
      console.error("Erreur frontend:", error.response?.data);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFinancialStatement = async (statementId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet état financier ?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour supprimer un état financier.");
        return;
      }
      await axios.delete(`http://localhost:3000/financial_statements/${statementId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFinancialStatements(financialStatements.filter((statement) => statement._id !== statementId));
      setError("État financier supprimé avec succès.");
    } catch (error) {
      setError(error.response?.data?.message || "Erreur lors de la suppression de l'état financier.");
      console.error("Erreur frontend:", error.response?.data);
    }
  };

  const regenerateFinancialStatement = async (statementId) => {
    if (!window.confirm("Voulez-vous régénérer cet état financier avec les dernières transactions ?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour régénérer un état financier.");
        return;
      }
      const statement = financialStatements.find((s) => s._id === statementId);
      const customTaxes = statement.taxes.map((tax) => ({
        type: tax.type,
        rate: tax.rate,
      }));
      const response = await axios.post(
        `http://localhost:3000/financial_statements/regenerate/${statementId}`,
        { customTaxes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFinancialStatements([
        ...financialStatements.filter((s) => s._id !== statementId),
        {
          ...response.data.financialStatement,
          tvaRate: statement.tvaRate,
        },
      ]);
      setError("État financier régénéré avec succès.");
    } catch (error) {
      setError(error.response?.data?.message || "Erreur lors de la régénération de l'état financier.");
      console.error("Erreur frontend:", error.response?.data);
    }
  };

  const startEditing = (statement) => {
    setEditingStatement(statement._id);
    setEditForm({
      total_revenue: statement.total_revenue,
      total_expenses: statement.total_expenses,
      net_profit: statement.net_profit,
      taxes: statement.taxes.map((tax) => ({
        _id: tax._id,
        type: tax.type,
        rate: tax.rate || (tax.type === "TVA" ? 0.19 : 0.15),
        amount: tax.amount,
      })),
    });
  };

  const updateFinancialStatement = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour modifier un état financier.");
        return;
      }
      if (
        editForm.total_revenue < 0 ||
        editForm.total_expenses < 0 ||
        isNaN(editForm.total_revenue) ||
        isNaN(editForm.total_expenses) ||
        isNaN(editForm.net_profit)
      ) {
        setError("Les revenus, dépenses et bénéfice net doivent être des nombres positifs.");
        return;
      }
      const calculatedNetProfit = editForm.total_revenue - editForm.total_expenses;
      if (Math.abs(calculatedNetProfit - editForm.net_profit) > 0.01) {
        setError("Le bénéfice net doit être égal aux revenus moins les dépenses.");
        return;
      }
      const response = await axios.put(
        `http://localhost:3000/financial_statements/${editingStatement}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFinancialStatements(
        financialStatements.map((statement) =>
          statement._id === editingStatement
            ? { ...response.data.financialStatement, tvaRate: statement.tvaRate }
            : statement
        )
      );
      setEditingStatement(null);
      setEditForm({ total_revenue: "", total_expenses: "", net_profit: "", taxes: [] });
      setError("État financier mis à jour avec succès.");
    } catch (error) {
      setError(error.response?.data?.message || "Erreur lors de la mise à jour de l'état financier.");
      console.error("Erreur frontend:", error.response?.data);
    }
  };

  const handleTaxChange = (index, field, value) => {
    const updatedTaxes = [...editForm.taxes];
    updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
    setEditForm({ ...editForm, taxes: updatedTaxes });
  };

  const addEditTax = () => {
    setEditForm({
      ...editForm,
      taxes: [...editForm.taxes, { type: "", rate: 0, amount: 0 }],
    });
  };

  const removeEditTax = (index) => {
    setEditForm({
      ...editForm,
      taxes: editForm.taxes.filter((_, i) => i !== index),
    });
  };

  const exportToPDF = (statement) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("État Financier", 10, 10);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(statement.date).toLocaleDateString()}`, 10, 20);
    doc.text(`Type: ${statement.type}`, 10, 30);
    doc.text(`Revenus: ${statement.total_revenue} ${walletData.currency}`, 10, 40);
    doc.text(`Dépenses: ${statement.total_expenses} ${walletData.currency}`, 10, 50);
    doc.text(`Bénéfice Net: ${statement.net_profit} ${walletData.currency}`, 10, 60);
    doc.text("Taxes:", 10, 70);
    statement.taxes.forEach((tax, index) => {
      doc.text(
        `${tax.type} (${isNaN(tax.rate) ? "0" : (tax.rate * 100).toFixed(2)}%): ${tax.amount} ${walletData.currency}`,
        10,
        80 + index * 10
      );
    });
    doc.save(`etat_financier_${statement._id}.pdf`);
  };

  const forecastTaxes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour prévoir les taxes.");
        return;
      }

      // Récupérer les états financiers pour les données historiques
      const statements = await axios.get(
        `http://localhost:3000/financial_statements/wallet/${walletId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("États financiers récupérés:", statements.data);

      // Préparer les données pour le modèle
      const historicalData = statements.data.slice(0, 12).map(statement => {
        console.log("Traitement de l'état financier:", statement);
        return {
          total_revenue: Number(statement.total_revenue) || 0,
          total_expenses: Number(statement.total_expenses) || 0,
          net_profit: Number(statement.net_profit) || 0,
          taxes: statement.taxes.map(tax => ({
            type: tax.type,
            rate: Number(tax.rate) || 0,
            amount: Number(tax.amount) || 0
          }))
        };
      });

      console.log("Données historiques préparées:", historicalData);

      // Utiliser les données les plus récentes comme données actuelles
      const currentData = historicalData[0] || {
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        taxes: []
      };

      console.log("Données actuelles:", currentData);

      // Appeler le service de prédiction Flask
      const response = await axios.post(
        "http://localhost:5001/forecast-taxes",
        {
          historical_data: historicalData,
          current_data: currentData
        }
      );

      console.log("Réponse du service de prédiction:", response.data);

      // Formater les résultats
      const taxTypes = [...new Set(historicalData[0]?.taxes.map(t => t.type) || [])];
      const forecastedTaxes = taxTypes.map((type, index) => {
        const prediction = response.data[index];
        console.log(`Prédiction pour ${type}:`, prediction);
        return {
          type,
          predicted_amount: Number(prediction?.predicted_amount) || 0,
          confidence: Number(prediction?.confidence) || 0.5
        };
      });

      console.log("Taxes prévues formatées:", forecastedTaxes);

      setForecastData({
        forecasted_taxes: forecastedTaxes,
        historical_trends: {
          avg_revenue: historicalData.reduce((sum, s) => sum + s.total_revenue, 0) / historicalData.length,
          avg_expenses: historicalData.reduce((sum, s) => sum + s.total_expenses, 0) / historicalData.length,
          avg_net_profit: historicalData.reduce((sum, s) => sum + s.net_profit, 0) / historicalData.length
        }
      });
      setError("");
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError(error.response?.data?.message || "Erreur lors de la prévision des taxes.");
    }
  };

  const toggleTaxesTable = (statementId) => {
    setShowTaxesTable((prev) => ({
      ...prev,
      [statementId]: !prev[statementId],
    }));
  };

  const getTaxChartData = (taxes) => ({
    labels: taxes.map((tax) => tax.type),
    datasets: [
      {
        data: taxes.map((tax) => tax.amount),
        backgroundColor: ["#FFD700", "#36A2EB", "#FFCE56", "#4BC0C0"],
        hoverBackgroundColor: ["#FFD700", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  });

  const getTaxTrendData = () => {
    const taxTypes = [...new Set(financialStatements.flatMap((s) => s.taxes.map((t) => t.type)))];
    const datasets = taxTypes.map((type, index) => ({
      label: type,
      data: financialStatements.map((s) => ({
        x: new Date(s.date),
        y: s.taxes.find((t) => t.type === type)?.amount || 0,
      })),
      borderColor: ["#FFD700", "#36A2EB", "#FFCE56", "#4BC0C0"][index % 4],
      fill: false,
    }));
    return {
      datasets,
    };
  };

  const TaxTable = ({ taxes }) => {
    const columnHelper = createColumnHelper();
    const columns = useMemo(
      () => [
        columnHelper.accessor("type", {
          header: "Type",
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("rate", {
          header: "Rate (%)",
          cell: (info) => (isNaN(info.getValue()) ? "0" : (info.getValue() * 100).toFixed(2)),
        }),
        columnHelper.accessor("amount", {
          header: "Amount",
          cell: (info) => `${info.getValue()} ${walletData.currency}`,
        }),
      ],
      [walletData.currency]
    );

    const [sorting, setSorting] = useState([]);
    const table = useReactTable({
      data: taxes,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    });

    return (
      <table className="tax-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <span>
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                      none: "",
                    }[header.column.getIsSorted() || "none"]}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="app-container">
      <CoolSidebar />
      <div className="elyess-content">
        <Navbar />
        <div className="wallet-container">
          <div className="wallet-header">
            <h2>Financial Statements</h2>
          </div>
          <div className="card form-container">
            <label>
              Period:
              <select value={period} onChange={(e) => setPeriod(e.target.value.toLowerCase())}>
                <option value="mensuel">Monthly</option>
                <option value="annuel">Annual</option>
              </select>
            </label>
            <label>
              Start Date:
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
              />
            </label>
            <h4>Custom Taxes</h4>
            {customTaxes.map((tax, index) => (
              <div key={`custom-tax-${index}`} className="custom-tax">
                <label>
                  Type:
                  <input
                    type="text"
                    value={tax.type}
                    onChange={(e) => updateCustomTax(index, "type", e.target.value)}
                    placeholder="ex: VAT, Income Tax"
                  />
                </label>
                <label>
                  Rate (%):
                  <input
                    type="number"
                    step="0.01"
                    value={tax.rate}
                    onChange={(e) => updateCustomTax(index, "rate", parseFloat(e.target.value))}
                    min="0"
                    max="1"
                  />
                </label>
                <button className="remove-tax-button" onClick={() => removeCustomTax(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button className="add-tax-button" onClick={addCustomTax}>
              Add Tax
            </button>
            <button
              className="submit-button"
              onClick={generateFinancialStatement}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Financial Statement"}
            </button>
          </div>
          <div className="card forecast-section">
            <div className="section-header">
              <h3>Tax Forecast</h3>
              <button className="forecast-button" onClick={forecastTaxes}>
                Forecast
              </button>
            </div>
            {forecastData && (
              <div className="forecast-results">
                {forecastData.forecasted_taxes.map((tax, index) => (
                  <div key={`forecast-tax-${index}`} className="forecast-tax-item">
                    <h4>{tax.type}</h4>
                    <p className="predicted-amount">
                      Predicted Amount: {Number(tax.predicted_amount || 0).toFixed(2)} {walletData.currency}
                    </p>
                    <p className="confidence-level">
                      Confidence Level: {Math.round((tax.confidence || 0) * 100)}%
                      <span className="confidence-explanation">
                        {(tax.confidence || 0) >= 0.9 ? " (Very Reliable)" :
                         (tax.confidence || 0) >= 0.8 ? " (Reliable)" :
                         (tax.confidence || 0) >= 0.7 ? " (Fairly Reliable)" :
                         (tax.confidence || 0) >= 0.6 ? " (Moderately Reliable)" :
                         " (Low Reliability)"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card tax-trend-chart">
            <div className="section-header">
              <h3>Tax Evolution</h3>
              <span
                className="toggle-icon"
                onClick={() => setShowCharts(!showCharts)}
                title={showCharts ? "Hide Chart" : "Show Chart"}
              >
                {showCharts ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {showCharts && (
              <Line
                data={getTaxTrendData()}
                options={{
                  responsive: true,
                  scales: {
                    x: {
                      type: "time",
                      time: { unit: "month" },
                      title: { display: true, text: "Date" },
                    },
                    y: {
                      title: { display: true, text: `Amount (${walletData.currency})` },
                    },
                  },
                  plugins: {
                    legend: { position: "top" },
                    title: { display: true, text: "Tax Trends" },
                  },
                }}
              />
            )}
          </div>
          <div className="financial-statements">
            {error && <p className="error-message">{error}</p>}
            {taxGenerationMessage && (
              <div className="tax-generation-message">
                {Array.isArray(taxGenerationMessage) ? (
                  <ul>
                    {taxGenerationMessage.map((message, index) => (
                      <li key={`tax-message-${index}`}>{message}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{taxGenerationMessage}</p>
                )}
              </div>
            )}
            {financialStatements.length > 0 ? (
              <div className="statements-list">
                {financialStatements.map((statement) => (
                  <div key={statement._id} className="card financial-statement-item">
                    {editingStatement === statement._id ? (
                      <div className="edit-form">
                        <h3>Edit Financial Statement</h3>
                        <label>
                          Revenue:
                          <input
                            type="number"
                            value={editForm.total_revenue}
                            onChange={(e) =>
                              setEditForm({ ...editForm, total_revenue: parseFloat(e.target.value) })
                            }
                          />
                        </label>
                        <label>
                          Expenses:
                          <input
                            type="number"
                            value={editForm.total_expenses}
                            onChange={(e) =>
                              setEditForm({ ...editForm, total_expenses: parseFloat(e.target.value) })
                            }
                          />
                        </label>
                        <label>
                          Net Profit:
                          <input
                            type="number"
                            value={editForm.net_profit}
                            onChange={(e) =>
                              setEditForm({ ...editForm, net_profit: parseFloat(e.target.value) })
                            }
                          />
                        </label>
                        <h4>Taxes:</h4>
                        {editForm.taxes.map((tax, index) => (
                          <div key={tax._id || `tax-edit-${index}`} className="tax-edit">
                            <label>
                              Type:
                              <input
                                type="text"
                                value={tax.type}
                                onChange={(e) => handleTaxChange(index, "type", e.target.value)}
                              />
                            </label>
                            <label>
                              Rate (%):
                              <input
                                type="number"
                                step="0.01"
                                value={tax.rate}
                                onChange={(e) =>
                                  handleTaxChange(index, "rate", parseFloat(e.target.value))
                                }
                              />
                            </label>
                            <label>
                              Amount:
                              <input
                                type="number"
                                value={tax.amount}
                                onChange={(e) =>
                                  handleTaxChange(index, "amount", parseFloat(e.target.value))
                                }
                              />
                            </label>
                            <button
                              className="remove-tax-button"
                              onClick={() => removeEditTax(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button className="add-tax-button" onClick={addEditTax}>
                          Add Tax
                        </button>
                        <div className="form-actions">
                          <button className="submit-button" onClick={updateFinancialStatement}>
                            Save
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => setEditingStatement(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {statement.hasNewerTransactions && (
                          <p className="update-alert">
                            New transactions have been added for this period. Please regenerate the financial statement.
                          </p>
                        )}
                        <div className="statement-details">
                          <p><strong>Date:</strong> {new Date(statement.date).toLocaleDateString()}</p>
                          <p><strong>Type:</strong> {statement.type}</p>
                          <p><strong>Revenue:</strong> {statement.total_revenue} {walletData.currency}</p>
                          <p><strong>Expenses:</strong> {statement.total_expenses} {walletData.currency}</p>
                          <p><strong>Net Profit:</strong> {statement.net_profit} {walletData.currency}</p>
                        </div>
                        <div className="section-header">
                          <h4>Taxes</h4>
                          <span
                            className="toggle-icon"
                            onClick={() => toggleTaxesTable(statement._id)}
                            title={showTaxesTable[statement._id] ? "Hide Table" : "Show Table"}
                          >
                            {showTaxesTable[statement._id] ? <FaEyeSlash /> : <FaEye />}
                          </span>
                        </div>
                        {showTaxesTable[statement._id] && statement.taxes?.length > 0 ? (
                          <>
                            <TaxTable taxes={statement.taxes} />
                            <div className="tax-chart">
                              <Doughnut
                                data={getTaxChartData(statement.taxes)}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: { position: "top" },
                                    title: { display: true, text: "Tax Distribution" },
                                  },
                                }}
                              />
                            </div>
                          </>
                        ) : showTaxesTable[statement._id] ? (
                          <p className="tax-generation-message">No taxes available.</p>
                        ) : null}
                        <div className="statement-actions">
                          <button
                            className="edit-button"
                            onClick={() => startEditing(statement)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => deleteFinancialStatement(statement._id)}
                          >
                            Delete
                          </button>
                          <button
                            className="regenerate-button"
                            onClick={() => regenerateFinancialStatement(statement._id)}
                          >
                            Regenerate
                          </button>
                          <button
                            className="export-button"
                            onClick={() => exportToPDF(statement)}
                          >
                            <FaDownload /> Export
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-statements">No financial statements found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatements;