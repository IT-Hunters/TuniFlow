import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowDown, FaArrowUp, FaExchangeAlt, FaHistory, FaChartLine } from "react-icons/fa";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import Deposit from "./Depossit";
import Withdraw from "./Withdraw";
import Transfer from "./Transfer";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import "./Tessst.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const Wallet = () => {
  const [activeScreen, setActiveScreen] = useState("main");
  const [walletData, setWalletData] = useState({ balance: 0, currency: "TND", transactions: [] });
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCharts, setShowCharts] = useState(false);
  const transactionsPerPage = 5;

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get("http://localhost:3000/users/findMyProfile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data._id;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du profil : ${error.message}`);
    }
  };

  const fetchWallet = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:3000/wallets/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du wallet : ${error.message}`);
    }
  };

  const fetchTransactions = async (walletId, token) => {
    try {
      const response = await axios.get(`http://localhost:3000/transactions/getTransactions/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des transactions : ${error.message}`);
    }
  };

  const fetchWalletData = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Veuillez vous connecter pour voir votre portefeuille.");
        return;
      }
      const userId = await fetchUserProfile(token);
      const wallet = await fetchWallet(userId, token);
      setWalletId(wallet._id);
      const transactions = await fetchTransactions(wallet._id, token);
      setWalletData({
        balance: wallet.balance,
        currency: wallet.currency,
        transactions: transactions,
      });
    } catch (error) {
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

  const filteredTransactions = walletData.transactions.filter((transaction) =>
    filter === "all" ? true : transaction.type === filter
  );

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const balanceData = {
    labels: walletData.transactions.map((t) => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: "Balance",
        data: walletData.transactions.reduce((acc, t, i) => {
          const previousBalance = i === 0 ? walletData.balance : acc[i - 1];
          return [...acc, t.type === "income" ? previousBalance + t.amount : previousBalance - t.amount];
        }, []),
        borderColor: "#007bff",
        fill: false,
      },
    ],
  };

  const pieData = {
    labels: ["Revenus", "Dépenses"],
    datasets: [
      {
        data: [
          walletData.transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0),
          walletData.transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0),
        ],
        backgroundColor: ["#28a745", "#dc3545"],
      },
    ],
  };

  return (
    <div className="app-container">
      <CoolSidebar />
      <div className="elyess-content">
        <Navbar />
        {activeScreen === "main" && (
          <div className="wallet-container">
            <div className="wallet-header">
              <h2>Wallet</h2>
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

              <div className="filter-buttons">
                <button
                  className={`filter-button ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Toutes
                </button>
                <button
                  className={`filter-button ${filter === "income" ? "active" : ""}`}
                  onClick={() => setFilter("income")}
                >
                  Revenus
                </button>
                <button
                  className={`filter-button ${filter === "expense" ? "active" : ""}`}
                  onClick={() => setFilter("expense")}
                >
                  Dépenses
                </button>
              </div>

              <div className="charts-toggle">
                <FaChartLine
                  className="charts-icon"
                  onClick={() => setShowCharts(!showCharts)}
                  title="Afficher/Masquer les statistiques"
                />
              </div>

              {showCharts && (
                <div className="charts-container">
                  <h3>Évolution du solde</h3>
                  <Line data={balanceData} options={{ responsive: true }} />
                  <h3>Répartition Revenus/Dépenses</h3>
                  <Pie data={pieData} options={{ responsive: true }} />
                </div>
              )}

              {currentTransactions.length > 0 ? (
                <ul>
                  {currentTransactions.map((transaction) => (
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

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </button>
                  <span>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </button>
                </div>
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