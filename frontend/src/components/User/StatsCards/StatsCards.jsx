"use client";

import { useEffect, useState } from "react";
import "./StatsCards.css";
import { fetchWorkingCapitalStatus } from "../../../services/AssetCalculationService";
import { getRevenueData, getExpenseData, calculateProfitMargin } from "../../../services/TransactionService";

export default function StatsCards() {
  const [workingCapitalStatus, setWorkingCapitalStatus] = useState(null);
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, revenueChange: 0 });
  const [profitMargin, setProfitMarginData] = useState(null);
  const [expenseData, setExpenseData] = useState({ totalExpenses: 0, expenseChange: 0 });

  useEffect(() => {
    const getStatsData = async () => {
      const userId = localStorage.getItem("userId");
      const projectId = "682382272a3034ef461e1911";

      try {
        const workingCapital = await fetchWorkingCapitalStatus(projectId);
        setWorkingCapitalStatus(workingCapital);

        const revenue = await getRevenueData(userId);
        setRevenueData(revenue);

        const profit = await calculateProfitMargin(userId);
        setProfitMarginData(profit);

        const expenses = await getExpenseData(userId);
        setExpenseData(expenses);
      } catch (error) {
        console.error("Error fetching stats data:", error);
      }
    };

    getStatsData();
  }, []);

  const stats = [
    {
      title: "Working Capital Status",
      value: workingCapitalStatus?.workingCapitalStatus?.value || "Loading...",
      change: workingCapitalStatus?.workingCapitalStatus?.change || "Loading...",
      icon: workingCapitalStatus?.workingCapitalStatus?.icon || "⏳",
      trend: workingCapitalStatus?.workingCapitalStatus?.trend || "up",
    },
    {
      title: "Revenue",
      value: `$${revenueData.totalRevenue?.toLocaleString() || "0"}`,
      change: revenueData.revenueChange >= 0 
        ? `+${revenueData.revenueChange?.toLocaleString() || "0"}` 
        : `${revenueData.revenueChange?.toLocaleString() || "0"}`,
      icon: "📈",
      trend: revenueData.revenueChange >= 0 ? "up" : "down",
    },
    {
      title: "Profit Margin",
      value: profitMargin?.profitMargin 
        ? `${profitMargin.profitMargin}%` 
        : "Loading...",
      change: profitMargin?.netIncome 
        ? (profitMargin.netIncome >= 0 
            ? `+${(profitMargin.netIncome / profitMargin.totalIncome * 100).toFixed(2)}%`
            : `${(profitMargin.netIncome / profitMargin.totalIncome * 100).toFixed(2)}%`)
        : "Loading...",
      icon: "💲",
      trend: profitMargin?.netIncome >= 0 ? "up" : "down",
    },
    {
      title: "Expenses",
      value: `$${expenseData.totalExpenses.toLocaleString()}`,
      change: expenseData.expenseChange >= 0 
        ? `+$${expenseData.expenseChange.toLocaleString()}` 
        : `-$${Math.abs(expenseData.expenseChange).toLocaleString()}`,
      icon: "📊",
      trend: expenseData.expenseChange >= 0 ? "up" : "down",
    },
  ];

  return (
    <div className="stats-container">
      {stats.map((stat) => (
        <div key={stat.title} className="stat-card">
          
          <div className="stat-content">
            <div>
              <p className="stat-title">{stat.title}</p>
              <div className="stat-value-container">
                <p className="stat-value">{stat.value}</p>
                <span className={`stat-change ${stat.trend === "up" ? "positive" : "negative"}`}>
                  {stat.change} last week
                </span>
              </div>
            </div>
            <div className="stat-icon">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}