// src/components/Invoice/ManagerInvoices.jsx
import React, { useState, useEffect } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import axios from "axios";
import "./invoiceStyles.css";

const ManagerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">My Sent Invoices</h2>

            {loading && (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                Loading invoices...
              </p>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && invoices.length === 0 && (
              <p>No invoices found.</p>
            )}

            {!loading && invoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Category</th>
                      <th>Recipient</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
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
                      </tr>
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