import React, { useState, useEffect } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import axios from "axios";
import "./invoiceStyles.css";
import { useTranslation } from "react-i18next";

const ManagerInvoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedHistory, setExpandedHistory] = useState({});
  const [exportStatus, setExportStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        console.log("Fetching invoices...");
        const token = localStorage.getItem("token");
        console.log("Fetching invoices with token:", token);
        const response = await axios.get(
          "http://localhost:3000/invoices/my-sent-invoices",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched Invoices:", response.data);
        setInvoices(response.data);
        return response.data; // Return invoices for the next step
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices: " + (err.response?.data?.message || err.message));
        return [];
      } finally {
        setLoading(false);
      }
    };

    const fetchPredictions = async (fetchedInvoices) => {
      if (!fetchedInvoices || fetchedInvoices.length === 0) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "http://localhost:3000/invoices/batch-predict-payment",
          { invoices: fetchedInvoices },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Batch prediction response:", response.data);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to get predictions");
        }

        const initialPredictions = {};
        response.data.predictions.forEach((pred) => {
          initialPredictions[pred.invoice_id] = pred.prediction;
        });
        
        setPredictions(initialPredictions);
        console.log("Predictions updated:", initialPredictions);
      } catch (err) {
        console.error("Error fetching batch predictions:", err);
        setError("Failed to load predictions: " + (err.response?.data?.message || err.message));
      }
    };

    // Run fetchInvoices and pass the result to fetchPredictions
    fetchInvoices().then((fetchedInvoices) => fetchPredictions(fetchedInvoices));
  }, []);

  const toggleHistory = (invoiceId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/invoices/export", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        params: { status: exportStatus },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoices_export_${exportStatus || "all"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export invoices: " + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">{t("My Sent Invoices")}</h2>

            <div className="export-section">
              <div className="export-filter">
                <label htmlFor="export-status">{t("Export Filter")}:</label>
                <select
                  id="export-status"
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                >
                  <option value="">{t("All")}</option>
                  <option value="PENDING">{t("Pending")}</option>
                  <option value="PAID">{t("Paid")}</option>
                </select>
              </div>
              <button onClick={handleExport} className="export-button" disabled={exporting}>
                {exporting ? (
                  <>
                    <span className="loading"></span>
                    {t("Exporting")}...
                  </>
                ) : (
                  t("Export to CSV")
                )}
              </button>
            </div>

            {loading && (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                {t("Loading invoices")}...
              </p>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && invoices.length === 0 && (
              <p>{t("No invoices found")}</p>
            )}

            {!loading && invoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>{t("Amount")}</th>
                      <th>{t("Due Date")}</th>
                      <th>{t("Category")}</th>
                      <th>{t("Recipient")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Predicted Status")}</th>
                      <th>{t("History")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      console.log(`Invoice ID: ${invoice._id}, Prediction exists: ${!!predictions[invoice._id]}`);
                      return (
                        <React.Fragment key={invoice._id}>
                          <tr>
                            <td>{invoice.amount} TND</td>
                            <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                            <td>{invoice.category || "N/A"}</td>
                            <td>
                              {(invoice.recipient_id?.fullname || "Unknown")} {(invoice.recipient_id?.lastname || "")}
                            </td>
                            <td>
                              <span
                                className={
                                  invoice.status === "PAID"
                                    ? "status-paid"
                                    : "status-pending"
                                }
                              >
                                {invoice.status || "N/A"}
                              </span>
                            </td>
                            <td>
                              {predictions[invoice._id] ? (
                                <div className="prediction-container">
                                  <span className={`prediction-status prediction-${predictions[invoice._id].prediction.toLowerCase()}`}>
                                    {predictions[invoice._id].prediction}
                                  </span>
                                  <div className="prediction-confidence">
                                    {(predictions[invoice._id].confidence * 100).toFixed(1)}% confident
                                  </div>
                                  <div className="prediction-details">
                                    {Object.entries(predictions[invoice._id].probabilities).map(([status, prob]) => (
                                      <div key={status} className="probability-item">
                                        {status}: {(prob * 100).toFixed(1)}%
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="prediction-error">
                                  Calculating...
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => toggleHistory(invoice._id)}
                                className="history-toggle-button"
                              >
                                {expandedHistory[invoice._id] ? t("Hide History") : t("Show History")}
                              </button>
                            </td>
                          </tr>
                          {expandedHistory[invoice._id] && (
                            <tr>
                              <td colSpan="7">
                                <div className="history-section p-4 bg-gray-100 rounded">
                                  <h4 className="text-md font-medium">{t("Action History")}</h4>
                                  {invoice.history && invoice.history.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                      {invoice.history.map((entry, index) => (
                                        <li key={index}>
                                          {entry.action === "CREATED" && t("Invoice Created")}
                                          {entry.action === "SENT" && t("Invoice Sent")}
                                          {entry.action === "PAID" && t("Invoice Paid")}
                                          {entry.action === "REMINDER_SENT" && t("Reminder Sent")}
                                          {entry.action === "UPCOMING_REMINDER_SENT" && t("Upcoming Reminder Sent")}
                                          {` ${t("by")} `}
                                          <strong>
                                            {(entry.user?.fullname || "Unknown User")} {(entry.user?.lastname || "")}
                                          </strong>
                                          {` ${t("on")} `}
                                          {new Date(entry.date).toLocaleString()}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>{t("No actions recorded")}</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerInvoices;
