// src/components/Invoice/OwnerInvoices.jsx
import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import axios from "axios";
import QRScanner from "./QRScanner";
import "./invoiceStyles.css";
import { useTranslation } from 'react-i18next';
import { FaFileExport } from 'react-icons/fa';
const OwnerInvoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [exportStatus, setExportStatus] = useState(""); // État pour le filtrage d'exportation
  const [exporting, setExporting] = useState(false); // État pour l'indicateur de chargement
  const invoiceRefs = useRef({});

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/invoices/my-invoices", { // Changement de port
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(response.data);
        setFilteredInvoices(response.data);
      } catch (err) {
        setError("Failed to load invoices: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.amount.toString().includes(searchLower) ||
        (invoice.category || "N/A").toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const handleAcceptInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/invoices/${invoiceId}/accept`, // Changement de port
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === invoiceId ? { ...invoice, status: "PAID" } : invoice
        )
      );
      setFilteredInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === invoiceId ? { ...invoice, status: "PAID" } : invoice
        )
      );
    } catch (err) {
      setError("Failed to accept invoice: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleScanner = () => {
    setShowScanner((prev) => !prev);
  };

  const handleScan = (invoiceId) => {
    if (invoiceRefs.current[invoiceId]) {
      invoiceRefs.current[invoiceId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const toggleHistory = (invoiceId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true); // Activer l'indicateur de chargement
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/invoices/export", { // Changement de port
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        params: { status: exportStatus }, // Ajouter le paramètre de filtrage
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoices_export_${exportStatus || 'all'}.csv`); // Nom de fichier dynamique
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to export invoices: " + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false); // Désactiver l'indicateur de chargement
    }
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">{t("My Invoices")}</h2>

            <div className="scanner-section">
              <button onClick={toggleScanner} className="scanner-toggle-button">
                {showScanner ? t("Hide QR Scanner") : t("Scan QR to Pay")}
              </button>
              {showScanner && <QRScanner onScan={handleScan} />}
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder={t("Search by amount, category, or status")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

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
    <>
      <FaFileExport style={{ marginRight: '8px' }} />
      {t("Export to CSV")}
    </>
  )}
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

            {!loading && !error && filteredInvoices.length === 0 && (
              <p>{t("No invoices found")}</p>
            )}

            {!loading && filteredInvoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>{t("Amount")}</th>
                      <th>{t("Due Date")}</th>
                      <th>{t("Category")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Action")}</th>
                      <th>{t("History")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <React.Fragment key={invoice._id}>
                        <tr ref={(el) => (invoiceRefs.current[invoice._id] = el)}>
                          <td>{invoice.amount} TND</td>
                          <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                          <td>{invoice.category || "N/A"}</td>
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
                            {invoice.status === "PENDING" ? (
                              <button
                                onClick={() => handleAcceptInvoice(invoice._id)}
                                className="accept-button"
                              >
                                {t("Accept")}
                              </button>
                            ) : (
                              <span className="accepted-label">{t("Accepted")}</span>
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
                                  {entry.action === "REMINDER_SENT" && t("Overdue Reminder Sent")}
                                 {entry.action === "UPCOMING_REMINDER_SENT" && t("Upcoming Reminder Sent")}
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

export default OwnerInvoices;