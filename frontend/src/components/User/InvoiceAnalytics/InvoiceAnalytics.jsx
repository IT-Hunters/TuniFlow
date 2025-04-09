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
    availableYears: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/invoices/statistics", {
          headers: { Authorization: `Bearer ${token}` },
          params: { period, year },
        });
        console.log("Stats received:", response.data);
        setStats(response.data);
      } catch (err) {
        setError("Error fetching invoice statistics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [period, year]);

  const chartData = {
    labels: stats.chartData.labels,
    datasets: [
      {
        label: "Invoice Amounts (TND)",
        data: stats.chartData.data,
        backgroundColor: "#007bff",
        borderColor: "#0056b3",
        borderWidth: 1,
        barThickness: period === "week" ? 10 : 20,
      },
    ],
  };

  console.log("Chart Data for rendering:", chartData);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (TND)",
          font: {
            size: 16,
            weight: "bold",
          },
          color: "#2c3e50",
        },
        ticks: {
          stepSize: 100,
          callback: (value) => `${value} TND`,
          font: {
            size: 12,
          },
          color: "#7f8c8d",
        },
        grid: {
          color: "#dfe6e9",
        },
      },
      x: {
        title: {
          display: true,
          text: period === "month" ? "Month" : period === "year" ? "Year" : "Week",
          font: {
            size: 16,
            weight: "bold",
          },
          color: "#2c3e50",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#7f8c8d",
          maxRotation: period === "week" ? 45 : 0,
          minRotation: period === "week" ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: period === "week" ? 10 : 12,
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
          color: "#2c3e50",
        },
      },
      tooltip: {
        backgroundColor: "#2c3e50",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
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
        <div>
          <h2 className="analytics-title">Invoice Analytics</h2>
          <p className="analytics-description">Overview of your invoice activity</p>
        </div>
       
      </div>
      <div className="analytics-content">
        {/* Statistics cards */}
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
        <div className="selectors">
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
          {period !== "year" && (
            <div className="year-selector">
              <label htmlFor="year">Year: </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {stats.availableYears.length > 0 ? (
                  stats.availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))
                ) : (
                  <option value={new Date().getFullYear()}>
                    {new Date().getFullYear()}
                  </option>
                )}
              </select>
            </div>
          )}
        </div>
        {/* Overdue invoices table - Moved before chart */}
        {stats.overdueInvoices && stats.overdueInvoices.length > 0 && (
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
                {stats.overdueInvoices.map((invoice, index) => (
                  <tr key={invoice.id || index}>
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

        {/* Chart - Moved to last position */}
        <div className="chart-container">
          <h3>
            Invoices by {period.charAt(0).toUpperCase() + period.slice(1)}{" "}
            {period !== "year" && `(${year})`}
          </h3>
          <div className="chart-wrapper">
            {chartData.labels.length > 0 && chartData.datasets[0].data.some(val => val > 0) ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p className="no-data">No data available for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAnalytics;