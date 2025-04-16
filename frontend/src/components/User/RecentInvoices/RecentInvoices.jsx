"use client";

import { useEffect, useState } from "react";
import InvoiceService from "../../../services/InvoiceService"; 
import "./RecentInvoices.css";
import PropTypes from "prop-types";
export default function RecentInvoices({ projectId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await InvoiceService.getInvoiceByProject(projectId);
        // Map API response to table format
        const mappedInvoices = data.map((invoice, index) => ({
          id: invoice._id,
          number: `INV-${(index + 1).toString().padStart(3, "0")}`, // e.g., INV-001
          customer: invoice.recipient_id.fullname || "Unknown Recipient",
          items: invoice.category || "N/A",
          date: new Date(invoice.due_date).toISOString().split("T")[0], // Format as YYYY-MM-DD
          status: invoice.status.toLowerCase(), // PENDING -> pending
          amount: invoice.amount,
        }));
        setInvoices(mappedInvoices);
      } catch (err) {
        setError(err.message || "Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchInvoices();
    } else {
      setError("Project ID is required");
      setLoading(false);
    }
  }, [projectId]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortBy === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return sortDirection === "asc"
        ? a[sortBy].localeCompare(b[sortBy])
        : b[sortBy].localeCompare(a[sortBy]);
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <span className="status-badge paid">Paid</span>;
      case "pending":
        return <span className="status-badge pending">Pending</span>;
      case "cancelled":
        return <span className="status-badge overdue">Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="invoices-card">
      <div className="invoices-header">
        <div className="invoices-title-container">
          <h2 className="invoices-title">Recent Invoices</h2>
          <p className="invoices-description">Manage your invoices and payment status</p>
        </div>
        <div className="invoices-actions">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search invoices..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="download-btn">📥</button>
        </div>
      </div>
      <div className="invoices-content">
        {loading ? (
          <div className="invoices-loading">
            <p>Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="invoices-error">
            <p>{error}</p>
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="invoices-empty">
            <p>No invoices found for this project.</p>
          </div>
        ) : (
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>
                    <button className="sort-button" onClick={() => handleSort("number")}>
                      Invoice
                      <span className="sort-icon">↕️</span>
                    </button>
                  </th>
                  <th>
                    <button className="sort-button" onClick={() => handleSort("customer")}>
                      Customer
                      <span className="sort-icon">↕️</span>
                    </button>
                  </th>
                  <th>Items</th>
                  <th>
                    <button className="sort-button" onClick={() => handleSort("date")}>
                      Date
                      <span className="sort-icon">↕️</span>
                    </button>
                  </th>
                  <th>
                    <button className="sort-button" onClick={() => handleSort("status")}>
                      Status
                      <span className="sort-icon">↕️</span>
                    </button>
                  </th>
                  <th className="amount-column">
                    <button className="sort-button" onClick={() => handleSort("amount")}>
                      Amount
                      <span className="sort-icon">↕️</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="invoice-number">{invoice.number}</td>
                    <td>{invoice.customer}</td>
                    <td>{invoice.items}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td className="amount-column">{invoice.amount.toLocaleString()} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
RecentInvoices.propTypes = {
  projectId: PropTypes.string.isRequired,
};