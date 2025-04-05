// src/components/Invoice/OwnerInvoices.jsx
import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import axios from "axios";
import QRScanner from "./QRScanner";
import "./invoiceStyles.css";

const OwnerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const invoiceRefs = useRef({}); // Références pour chaque ligne du tableau

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/invoices/my-invoices", {
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
        `http://localhost:3000/invoices/${invoiceId}/accept`,
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
    // Faire défiler vers la facture correspondante
    if (invoiceRefs.current[invoiceId]) {
      invoiceRefs.current[invoiceId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">My Invoices</h2>

            <div className="scanner-section">
              <button onClick={toggleScanner} className="scanner-toggle-button">
                {showScanner ? "Hide QR Scanner" : "Scan QR to Pay"}
              </button>
              {showScanner && <QRScanner onScan={handleScan} />}
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder="Search by amount, category, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading && (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                Loading invoices...
              </p>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && filteredInvoices.length === 0 && (
              <p>No invoices found.</p>
            )}

            {!loading && filteredInvoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        ref={(el) => (invoiceRefs.current[invoice._id] = el)} // Ajouter une ref à chaque ligne
                      >
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
                              Accept
                            </button>
                          ) : (
                            <span className="accepted-label">Accepted</span>
                          )}
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

export default OwnerInvoices;