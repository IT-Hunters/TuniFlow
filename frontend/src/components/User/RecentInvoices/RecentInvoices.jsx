"use client";

import { useEffect, useState } from "react";
import "./RecentInvoices.css";

export default function RecentInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    // Simulate fetching invoices
    setTimeout(() => {
      const mockInvoices = [
        {
          id: "1",
          number: "INV-2023-001",
          customer: "Acme Corporation",
          items: "Financial Software License",
          date: "2023-03-15",
          status: "paid",
          amount: 5200,
        },
        {
          id: "2",
          number: "INV-2023-002",
          customer: "Globex Inc.",
          items: "Consulting Services",
          date: "2023-03-18",
          status: "pending",
          amount: 3750,
        },
        {
          id: "3",
          number: "INV-2023-003",
          customer: "Wayne Enterprises",
          items: "Accounting System Maintenance",
          date: "2023-03-10",
          status: "overdue",
          amount: 1800,
        },
        {
          id: "4",
          number: "INV-2023-004",
          customer: "Stark Industries",
          items: "HR Management Platform",
          date: "2023-03-22",
          status: "paid",
          amount: 6500,
        },
        {
          id: "5",
          number: "INV-2023-005",
          customer: "LexCorp",
          items: "Financial Advisory Services",
          date: "2023-03-25",
          status: "pending",
          amount: 4200,
        },
      ];
      setInvoices(mockInvoices);
      setLoading(false);
    }, 2000);
  }, []);

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
      return sortDirection === "asc" ? a[sortBy].localeCompare(b[sortBy]) : b[sortBy].localeCompare(a[sortBy]);
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <span className="status-badge paid">Paid</span>;
      case "pending":
        return <span className="status-badge pending">Pending</span>;
      case "overdue":
        return <span className="status-badge overdue">Overdue</span>;
      default:
        return null;
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
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="invoice-number">{invoice.number}</td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.items}</td>
                      <td>{new Date(invoice.date).toLocaleDateString()}</td>
                      <td>{getStatusBadge(invoice.status)}</td>
                      <td className="amount-column">${invoice.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
