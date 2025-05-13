import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowDown, FaArrowUp, FaExchangeAlt, FaHistory, FaChartLine, FaCalendar } from "react-icons/fa";
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
import Deposit from "./Depossit"; // Note: Fix typo in filename if needed (Depossit → Deposit)
import Withdraw from "./Withdraw";
import Transfer from "./Transfer";
import SalaryScheduler from "./SalaryScheduler"; // Import SalaryScheduler
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

  const createWallet = async (userId, token) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/wallets/addWallet",
        { user_id: userId, type: "personal" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.wallet;
    } catch (error) {
      throw new Error(`Erreur lors de la création du wallet : ${error.message}`);
    }
  };

  const fetchWallet = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/wallets/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data || !response.data._id) {
        throw new Error("Aucun portefeuille trouvé pour cet utilisateur.");
      }
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return await createWallet(userId, token);
      }
      throw new Error(`Erreur lors de la récupération du wallet : ${error.message}`);
    }
  };

  const fetchTransactions = async (walletId, token) => {
    try {
      const response = await axios.get(`http://localhost:5000/transactions/getTransactions/${walletId}`, {
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
    let isMounted = true;

    if (isMounted) {
      fetchWalletData();
    }

    return () => {
      isMounted = false;
    };
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
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="wallet-cards-container">
              {/* Balance Card */}
              <div className="wallet-card balance">
                <div className="wallet-card-title">
                  <div className="wallet-card-title-left">
                    <span className="wallet-card-icon-wrapper">
                      <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1362 1185q0 153-99.5 263.5t-258.5 136.5v175q0 14-9 23t-23 9h-135q-13 0-22.5-9.5t-9.5-22.5v-175q-66-9-127.5-31t-101.5-44.5-74-48-46.5-37.5-17.5-18q-17-21-2-41l103-135q7-10 23-12 15-2 24 9l2 2q113 99 243 125 37 8 74 8 81 0 142.5-43t61.5-122q0-28-15-53t-33.5-42-58.5-37.5-66-32-80-32.5q-39-16-61.5-25t-61.5-26.5-62.5-31-56.5-35.5-53.5-42.5-43.5-49-35.5-58-21-66.5-8.5-78q0-138 98-242t255-134v-180q0-13 9.5-22.5t22.5-9.5h135q14 0 23 9t9 23v176q57 6 110.5 23t87 33.5 63.5 37.5 39 29 15 14q17 18 5 38l-81 146q-8 15-23 16-14 3-27-7-3-3-14.5-12t-39-26.5-58.5-32-74.5-26-85.5-11.5q-95 0-155 43t-60 111q0 26 8.5 48t29.5 41.5 39.5 33 56 31 60.5 27 70 27.5q53 20 81 31.5t76 35 75.5 42.5 62 50 53 63.5 31.5 76.5 13 94z">
                        </path>
                      </svg>
                    </span>
                    <p className="wallet-card-title-text">Total Balance</p>
                  </div>
                </div>
                <div className="wallet-card-data">
                  <p className="wallet-card-amount">{walletData.balance} {walletData.currency}</p>
                  <div className="wallet-card-range">
                    <div className="wallet-card-range-fill"></div>
                  </div>
                </div>
              </div>

              {/* Income Card */}
              <div className="wallet-card income">
                <div className="wallet-card-title">
                  <div className="wallet-card-title-left">
                    <span className="wallet-card-icon-wrapper">
                      <FaArrowDown />
                    </span>
                    <p className="wallet-card-title-text">Total Income</p>
                  </div>
                  <p className="wallet-card-percent up">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="20" width="20">
                      <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z"></path>
                    </svg>
                    20%
                  </p>
                </div>
                <div className="wallet-card-data">
                  <p className="wallet-card-amount">
                    {walletData.transactions
                      .filter(t => t.type === "income")
                      .reduce((sum, t) => sum + t.amount, 0)} {walletData.currency}
                  </p>
                  <div className="wallet-card-range">
                    <div className="wallet-card-range-fill"></div>
                  </div>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="wallet-card expenses">
                <div className="wallet-card-title">
                  <div className="wallet-card-title-left">
                    <span className="wallet-card-icon-wrapper">
                      <FaArrowUp />
                    </span>
                    <p className="wallet-card-title-text">Total Expenses</p>
                  </div>
                  <p className="wallet-card-percent down">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="20" width="20">
                      <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z"></path>
                    </svg>
                    15%
                  </p>
                </div>
                <div className="wallet-card-data">
                  <p className="wallet-card-amount">
                    {walletData.transactions
                      .filter(t => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0)} {walletData.currency}
                  </p>
                  <div className="wallet-card-range">
                    <div className="wallet-card-range-fill"></div>
                  </div>
                </div>
              </div>
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
              <div className="action" onClick={() => setActiveScreen("scheduler")}>
                <div className="action-icon">
                  <FaCalendar />
                </div>
                <p>Salary Scheduler</p>
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
                  All
                </button>
                <button
                  className={`filter-button ${filter === "income" ? "active" : ""}`}
                  onClick={() => setFilter("income")}
                >
                  Income
                </button>
                <button
                  className={`filter-button ${filter === "expense" ? "active" : ""}`}
                  onClick={() => setFilter("expense")}
                >
                  Expenses
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
        {activeScreen === "scheduler" && <SalaryScheduler goBack={refreshWalletData} walletId={walletId} />}
      </div>
    </div>
  );
};

export default Wallet;