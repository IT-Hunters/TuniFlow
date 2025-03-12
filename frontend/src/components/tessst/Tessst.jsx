import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowDown, FaArrowUp, FaExchangeAlt, FaHistory } from "react-icons/fa";
import Deposit from "./Depossit";
import Withdraw from "./Withdraw";
import Transfer from "./Transfer";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "./Tessst.css";

const Wallet = () => {
  const [activeScreen, setActiveScreen] = useState("main");
  const [walletData, setWalletData] = useState({ balance: 0, currency: "TND", transactions: [] });
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState("");

  const fetchUserProfile = async (token) => {
    try {
      console.log("Étape 1 : Récupération du profil utilisateur...");
      const response = await axios.get("http://localhost:5000/users/findMyProfile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profil utilisateur récupéré :", response.data);
      return response.data._id;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération du profil : ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const fetchWallet = async (userId, token) => {
    try {
      console.log("Étape 2 : Récupération du wallet pour userId :", userId);
      const response = await axios.get(`http://localhost:5000/wallets/user/${userId}`, { // Corrigé ici
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Wallet récupéré :", response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération du wallet : ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const fetchTransactions = async (walletId, token) => {
    try {
      console.log("Étape 3 : Récupération des transactions pour walletId :", walletId);
      const response = await axios.get(`http://localhost:5000/transactions/getTransactions/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Transactions récupérées :", response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des transactions : ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const fetchWalletData = async () => {
    setError(""); // Réinitialiser l'erreur au début
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour voir votre portefeuille.");
        console.log("Erreur : Aucun token trouvé dans localStorage");
        return;
      }

      // Étape 1 : Récupérer l'ID de l'utilisateur
      const userId = await fetchUserProfile(token);

      // Étape 2 : Récupérer le wallet
      const wallet = await fetchWallet(userId, token);
      setWalletId(wallet._id);

      // Étape 3 : Récupérer les transactions
      const transactions = await fetchTransactions(wallet._id, token);

      // Mettre à jour l'état avec les données récupérées
      setWalletData({
        balance: wallet.balance,
        currency: wallet.currency,
        transactions: transactions,
      });
    } catch (error) {
      console.error("Erreur dans fetchWalletData :", error);
      setError(error.message || "Erreur lors de la récupération des données.");
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const refreshWalletData = () => {
    fetchWalletData();
    setActiveScreen("main");
  };

  return (
    <div className="app-container">
      <CoolSidebar />
      <div className="main-content">
        <Navbar />
        {activeScreen === "main" && (
          <div className="wallet-container">
            <div className="wallet-header">
              <h2> Wallet</h2>
              <p className="wallet-balance">
                Balance : {walletData.balance} {walletData.currency}
              </p>
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="wallet-actions">
              <div className="action" onClick={() => setActiveScreen("deposit")}>
                <div className="action-icon">
                  <FaArrowDown />
                </div>
                <p>Deposit</p>
              </div>
              <div className="action" onClick={() => setActiveScreen("withdraw")}>
                <div className="action-icon">
                  <FaArrowUp />
                </div>
                <p>Withdrawal</p>
              </div>
              <div className="action" onClick={() => setActiveScreen("transfer")}>
                <div className="action-icon">
                  <FaExchangeAlt />
                </div>
                <p>Transfer</p>
              </div>
            </div>

            <div className="transaction-history">
              <h3>
                <FaHistory /> Recent Transactions
              </h3>
              {walletData.transactions.length > 0 ? (
                <ul>
                  {walletData.transactions.map((transaction) => (
                    <li key={transaction._id} className="transaction-item">
                      <div className="transaction-icon">
                        {transaction.type === "income" ? (
                          <FaArrowDown className="income" />
                        ) : (
                          <FaArrowUp className="expense" />
                        )}
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-description">{transaction.description || transaction.type}</p>
                        <p className="transaction-date">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
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

        {activeScreen === "deposit" && <Deposit goBack={refreshWalletData} walletId={walletId} />}
        {activeScreen === "withdraw" && <Withdraw goBack={refreshWalletData} walletId={walletId} />}
        {activeScreen === "transfer" && <Transfer goBack={refreshWalletData} walletId={walletId} />}
      </div>
    </div>
  );
};

export default Wallet;