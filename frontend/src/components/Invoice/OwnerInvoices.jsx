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
  const [expandedHistory, setExpandedHistory] = useState({}); // État pour gérer l'affichage de l'historique
  const invoiceRefs = useRef({});

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
        setError("Échec du chargement des factures : " + (err.response?.data?.message || err.message));
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
      setError("Échec de l'acceptation de la facture : " + (err.response?.data?.message || err.message));
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

  // Fonction pour basculer l'affichage de l'historique
  const toggleHistory = (invoiceId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  return (
    <div className="create-invoice-page">
      <CoolSidebar />
      <div className="create-invoice-main">
        <Navbar />
        <div className="main-content">
          <div className="invoice-container">
            <h2 className="invoice-header">Mes factures</h2>

            <div className="scanner-section">
              <button onClick={toggleScanner} className="scanner-toggle-button">
                {showScanner ? "Masquer le scanner QR" : "Scanner QR pour payer"}
              </button>
              {showScanner && <QRScanner onScan={handleScan} />}
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder="Rechercher par montant, catégorie ou statut..."
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
                Chargement des factures...
              </p>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && filteredInvoices.length === 0 && (
              <p>Aucune facture trouvée.</p>
            )}

            {!loading && filteredInvoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Montant</th>
                      <th>Date d'échéance</th>
                      <th>Catégorie</th>
                      <th>Statut</th>
                      <th>Action</th>
                      <th>Historique</th> {/* Nouvelle colonne pour l'historique */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <React.Fragment key={invoice._id}>
                        <tr ref={(el) => (invoiceRefs.current[invoice._id] = el)}>
                          <td>{invoice.amount} TND</td>
                          <td>{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</td>
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
                                Accepter
                              </button>
                            ) : (
                              <span className="accepted-label">Acceptée</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => toggleHistory(invoice._id)}
                              className="history-toggle-button"
                            >
                              {expandedHistory[invoice._id] ? "Masquer" : "Afficher"} l'historique
                            </button>
                          </td>
                        </tr>
                        {expandedHistory[invoice._id] && (
                          <tr>
                            <td colSpan="6">
                              <div className="history-section p-4 bg-gray-100 rounded">
                                <h4 className="text-md font-medium">Historique des actions</h4>
                                {invoice.history && invoice.history.length > 0 ? (
                                  <ul className="list-disc pl-5">
                                    {invoice.history.map((entry, index) => (
                                      <li key={index}>
                                        {entry.action === "CREATED" && "Facture créée"}
                                        {entry.action === "SENT" && "Facture envoyée"}
                                        {entry.action === "PAID" && "Facture payée"}
                                        {entry.action === "REMINDER_SENT" && "Rappel envoyé"}
                                        {" par "}
                                        <strong>
                                          {entry.user?.fullname || "Utilisateur inconnu"}{" "}
                                          {entry.user?.lastname || ""}
                                        </strong>
                                        {" le "}
                                        {new Date(entry.date).toLocaleString('fr-FR')}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>Aucune action enregistrée.</p>
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