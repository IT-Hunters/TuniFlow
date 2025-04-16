"use client";

import { useEffect, useState, useRef } from "react";
import "./TransactionChart.css";
import { getTransactionById } from "../../../services/TransactionService";

export default function TransactionChart({ walletId }) {
  const [activeTab, setActiveTab] = useState("weekly");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!walletId) {
        setError("No wallet ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getTransactionById(walletId);
        console.log("Transaction data:", data);
        if (!data || !data.data || !Array.isArray(data.data)) {
          throw new Error("Invalid transaction data received");
        }

        const transactions = data.data;
        let labels = [];
        let values = []; // Net values (revenue - expenses)
        let revenueValues = []; // Track revenue separately
        let expenseValues = []; // Track expenses separately

        const today = new Date();

        switch (activeTab) {
          case "weekly": {
            labels = Array.from({ length: 7 }, (_, i) => {
              const date = new Date(today);
              date.setDate(today.getDate() - (6 - i));
              return date.toLocaleDateString("en-US", { weekday: "short" });
            });

            values = Array(7).fill(0);
            revenueValues = Array(7).fill(0);
            expenseValues = Array(7).fill(0);

            transactions.forEach((tx) => {
              const txDate = new Date(tx.date);
              const dayDiff = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
              if (dayDiff >= 0 && dayDiff < 7) {
                const index = 6 - dayDiff;
                if (tx.type === "income") {
                  revenueValues[index] += tx.amount || 0;
                  values[index] += tx.amount || 0;
                } else if (tx.type === "expense") {
                  expenseValues[index] += tx.amount || 0;
                  values[index] -= tx.amount || 0;
                }
              }
            });
            break;
          }

          case "monthly": {
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
            values = Array(4).fill(0);
            revenueValues = Array(4).fill(0);
            expenseValues = Array(4).fill(0);

            transactions.forEach((tx) => {
              const txDate = new Date(tx.date);
              const daysDiff = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
              const weekIndex = Math.floor(daysDiff / 7);
              if (weekIndex >= 0 && weekIndex < 4) {
                const index = 3 - weekIndex;
                if (tx.type === "income") {
                  revenueValues[index] += tx.amount || 0;
                  values[index] += tx.amount || 0;
                } else if (tx.type === "expense") {
                  expenseValues[index] += tx.amount || 0;
                  values[index] -= tx.amount || 0;
                }
              }
            });
            break;
          }

          case "yearly": {
            labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            values = Array(12).fill(0);
            revenueValues = Array(12).fill(0);
            expenseValues = Array(12).fill(0);

            transactions.forEach((tx) => {
              const txDate = new Date(tx.date);
              const monthDiff = (today.getFullYear() - txDate.getFullYear()) * 12 + 
                              (today.getMonth() - txDate.getMonth());
              if (monthDiff >= 0 && monthDiff < 12) {
                const index = 11 - monthDiff;
                if (tx.type === "income") {
                  revenueValues[index] += tx.amount || 0;
                  values[index] += tx.amount || 0;
                } else if (tx.type === "expense") {
                  expenseValues[index] += tx.amount || 0;
                  values[index] -= tx.amount || 0;
                }
              }
            });
            break;
          }
        }

        const hasData = values.some(v => v !== 0);
        if (hasData) {
          setChartData({
            labels,
            values,
            revenueValues,
            expenseValues,
            maxValue: Math.max(...values, 1),
            minValue: Math.min(...values, 0),
          });
        } else {
          setChartData(null);
        }
      } catch (err) {
        setError("Failed to load transaction data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [activeTab, walletId]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Revenue Overview</h2>
          <p className="chart-description">Track your wallet's net financial performance over time</p>
        </div>
        <div className="chart-tabs">
          <button
            className={`tab-button ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly
          </button>
          <button
            className={`tab-button ${activeTab === "monthly" ? "active" : ""}`}
            onClick={() => setActiveTab("monthly")}
          >
            Monthly
          </button>
          <button
            className={`tab-button ${activeTab === "yearly" ? "active" : ""}`}
            onClick={() => setActiveTab("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>
      <div className="chart-content">
        {loading ? (
          <div className="chart-loading">
            <p>Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="chart-error">
            <p>{error}</p>
          </div>
        ) : chartData ? (
          <div className="chart-container" ref={chartRef}>
            <div className="chart-bars">
              {chartData.labels.map((label, index) => {
                const value = chartData.values[index];
                const revenue = chartData.revenueValues[index];
                const expense = chartData.expenseValues[index];
                const maxAbsValue = Math.max(chartData.maxValue, Math.abs(chartData.minValue));
                const height = Math.abs(value) / maxAbsValue * 250;
                const isNegative = value < 0;
                return (
                  <div key={label} className="chart-bar-container">
                    <div 
                      className={`chart-bar ${isNegative ? "negative-bar" : "positive-bar"}`}
                      style={{ 
                        height: `${height}px`,
                        transform: isNegative ? "translateY(100%)" : "none",
                      }}
                      title={`Revenue: $${revenue.toLocaleString()}\nExpenses: $${expense.toLocaleString()}\nNet: $${value.toLocaleString()}`}
                    ></div>
                    <div className="chart-label">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="chart-empty">
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}