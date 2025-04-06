// src/components/Invoice/ManagerInvoices.jsx
import React, { useState, useEffect } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import axios from "axios";
import "./invoiceStyles.css";
import { useTranslation } from 'react-i18next';

const ManagerInvoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedHistory, setExpandedHistory] = useState({});

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/invoices/my-sent-invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(response.data);
      } catch (err) {
        setError("Failed to load invoices: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const toggleHistory = (invoiceId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/invoices/export", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export invoices: " + (err.response?.data?.message || err.message));
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
              <button onClick={handleExport} className="export-button">
                {t("Export to CSV")}
              </button>
            </div>

            {loading && (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                {t("Loading invoices")}
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
                      <th>{t("History")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <React.Fragment key={invoice._id}>
                        <tr>
                          <td>{invoice.amount} TND</td>
                          <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                          <td>{invoice.category || "N/A"}</td>
                          <td>
                            {invoice.recipient_id?.fullname} {invoice.recipient_id?.lastname}
                          </td>
                          <td>
                            <span
                              className={
                                invoice.status === "PAID"
                                  ? "status-paid"
                                  : "status-pending"
                              }
                            >
                              {invoice.status}
                            </span>
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
                            <td colSpan="6">
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
                                        {` ${t("by")} `}
                                        <strong>
                                          {entry.user?.fullname || "Unknown User"}{" "}
                                          {entry.user?.lastname || ""}
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
                    ))}
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