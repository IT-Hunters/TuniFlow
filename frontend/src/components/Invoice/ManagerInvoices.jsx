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
  const [expandedHistory, setExpandedHistory] = useState({}); // État pour gérer l'affichage de l'historique

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
        setError("Échec du chargement des factures : " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

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
            <h2 className="invoice-header">Mes factures envoyées</h2>

            {loading && (
              <p className="loading-recipient">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                Chargement des factures...
              </p>
            )}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && invoices.length === 0 && (
              <p>Aucune facture trouvée.</p>
            )}

            {!loading && invoices.length > 0 && (
              <div className="invoices-list">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Montant</th>
                      <th>Date d'échéance</th>
                      <th>Catégorie</th>
                      <th>Destinataire</th>
                      <th>Statut</th>
                      <th>Historique</th> {/* Nouvelle colonne pour l'historique */}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <React.Fragment key={invoice._id}>
                        <tr>
                          <td>{invoice.amount} TND</td>
                          <td>{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</td>
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

export default ManagerInvoices;