// Frontend: src/components/InvoiceAnalytics/InvoiceAnalytics.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "./InvoiceAnalytics.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const InvoiceAnalytics = () => {
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    chartData: { labels: [], data: [] },
    overdueInvoices: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/invoices/statistics", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        });
        console.log("Stats received:", response.data); // Log pour vérifier les données
        setStats(response.data);
      } catch (err) {
        setError("Error fetching invoice statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [period]);

  // Données pour le graphique
  const chartData = {
    labels: stats.chartData.labels,
    datasets: [
      {
        label: "Invoice Amounts (TND)",
        data: stats.chartData.data,
        backgroundColor: "#007bff",
        borderColor: "#0056b3",
        borderWidth: 1,
      },
    ],
  };

  console.log("Chart Data for rendering:", chartData); // Log pour vérifier les données du graphique

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (TND)",
        },
      },
      x: {
        title: {
          display: true,
          text: period === "month" ? "Month" : period === "year" ? "Year" : "Week",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} TND`,
        },
      },
    },
  };

  if (loading) return <p>Loading statistics...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="invoice-analytics-card">
      <div className="analytics-header">
        <h2 className="analytics-title">Invoice Analytics</h2>
        <p className="analytics-description">Overview of your invoice activity</p>
        <div className="period-selector">
          <label htmlFor="period">View by: </label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="week">Week</option>
          </select>
        </div>
      </div>
      <div className="analytics-content">
        {/* Cartes de statistiques */}
        <div className="stats-cards">
          <div className="stats-card">
            <h3>Total Paid</h3>
            <p className="stats-value">{stats.totalPaid.toLocaleString()} TND</p>
          </div>
          <div className="stats-card">
            <h3>Total Pending</h3>
            <p className="stats-value">{stats.totalPending.toLocaleString()} TND</p>
          </div>
          <div className="stats-card">
            <h3>Total Overdue</h3>
            <p className="stats-value">{stats.totalOverdue.toLocaleString()} TND</p>
          </div>
        </div>

        {/* Liste des factures en retard (déplacée avant le graphique) */}
        {stats.overdueInvoices.length > 0 && (
          <div className="overdue-invoices">
            <h3>Overdue Invoices</h3>
            <table className="overdue-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Category</th>
                  <th>{stats.overdueInvoices[0].recipient ? "Recipient" : "Creator"}</th>
                </tr>
              </thead>
              <tbody>
                {stats.overdueInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.amount} TND</td>
                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td>{invoice.category || "N/A"}</td>
                    <td>{invoice.recipient || invoice.creator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Graphique */}
        <div className="chart-container">
          <h3>Invoices by {period.charAt(0).toUpperCase() + period.slice(1)}</h3>
          <div className="chart-wrapper">
            {chartData.labels.length > 0 && chartData.datasets[0].data.some(val => val > 0) ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p>No data available for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAnalytics;