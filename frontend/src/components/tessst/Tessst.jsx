import React, { useState } from "react";
import { FaArrowDown, FaArrowUp, FaExchangeAlt, FaHistory } from "react-icons/fa";
import Deposit from "./Depossit";
import Withdraw from "./Withdraw";
import Transfer from "./Transfer";
import CoolSidebar from "../sidebarHome/newSidebar"; // Assurez-vous que le chemin est correct
import Navbar from "../navbarHome/NavbarHome";
import "./Tessst.css";

const Wallet = () => {
  const [activeScreen, setActiveScreen] = useState("main");

  // Données statiques pour le solde et les transactions
  const walletData = {
    balance: 1500,
    currency: "TND",
    transactions: [
      { id: 1, type: "income", amount: 500, date: "2023-10-01", description: "Dépôt" },
      { id: 2, type: "expense", amount: 200, date: "2023-10-02", description: "Retrait" },
      { id: 3, type: "transfer", amount: 300, date: "2023-10-03", description: "Transfert" },
    ],
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <CoolSidebar />

      {/* Contenu principal */}
      <div className="main-content">
        {/* Navbar */}
        <Navbar />

        {/* Afficher l'écran principal du portefeuille */}
        {activeScreen === "main" && (
          <div className="wallet-container">
            {/* En-tête du portefeuille */}
            <div className="wallet-header">
              <h2>Mon Portefeuille</h2>
              <p className="wallet-balance">
                Solde : {walletData.balance} {walletData.currency}
              </p>
            </div>

            {/* Actions du portefeuille (Dépôt, Retrait, Transfert) */}
            <div className="wallet-actions">
              <div className="action" onClick={() => setActiveScreen("deposit")}>
                <div className="action-icon">
                  <FaArrowDown />
                </div>
                <p>Dépôt</p>
              </div>
              <div className="action" onClick={() => setActiveScreen("withdraw")}>
                <div className="action-icon">
                  <FaArrowUp />
                </div>
                <p>Retrait</p>
              </div>
              <div className="action" onClick={() => setActiveScreen("transfer")}>
                <div className="action-icon">
                  <FaExchangeAlt />
                </div>
                <p>Transfert</p>
              </div>
            </div>

            {/* Historique des transactions */}
            <div className="transaction-history">
              <h3>
                <FaHistory /> Historique des Transactions
              </h3>
              {walletData.transactions.length > 0 ? (
                <ul>
                  {walletData.transactions.map((transaction) => (
                    <li key={transaction.id} className="transaction-item">
                      <div className="transaction-icon">
                        {transaction.type === "income" ? (
                          <FaArrowDown className="income" />
                        ) : transaction.type === "expense" ? (
                          <FaArrowUp className="expense" />
                        ) : (
                          <FaExchangeAlt className="transfer" />
                        )}
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-description">{transaction.description}</p>
                        <p className="transaction-date">{transaction.date}</p>
                      </div>
                      <p className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === "income" ? "+" : "-"} {transaction.amount} {walletData.currency}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-transactions">Aucune transaction trouvée.</p>
              )}
            </div>
          </div>
        )}

        {/* Afficher l'écran de dépôt */}
        {activeScreen === "deposit" && <Deposit goBack={() => setActiveScreen("main")} />}

        {/* Afficher l'écran de retrait */}
        {activeScreen === "withdraw" && <Withdraw goBack={() => setActiveScreen("main")} />}

        {/* Afficher l'écran de transfert */}
        {activeScreen === "transfer" && <Transfer goBack={() => setActiveScreen("main")} />}
      </div>
    </div>
  );
};

export default Wallet;