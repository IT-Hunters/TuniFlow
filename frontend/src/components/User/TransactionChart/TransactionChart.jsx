"use client";

import { useEffect, useState, useRef } from "react";
import "./TransactionChart.css";

export default function TransactionChart() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchChartData = () => {
      // Simulating different data for different tabs
      let labels = [];
      let values = [];

      if (activeTab === "weekly") {
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        values = [4500, 3800, 6000, 2700, 5500, 7000, 8500];
      } else if (activeTab === "monthly") {
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        values = [21000, 18000, 24000, 19000];
      } else {
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        values = [48000, 38000, 42000, 46000, 53000, 59000, 63000, 58000, 56000, 67000, 62000, 73000];
      }

      setChartData({ labels, values });
    };

    fetchChartData();
  }, [activeTab]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Revenue Overview</h2>
          <p className="chart-description">Track your company's financial performance over time</p>
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
        {chartData ? (
          <div className="chart-container" ref={chartRef}>
            <div className="chart-bars">
              {chartData.labels.map((label, index) => {
                const height = (chartData.values[index] / Math.max(...chartData.values)) * 250;
                return (
                  <div key={label} className="chart-bar-container">
                    <div className="chart-bar" style={{ height: `${height}px` }}></div>
                    <div className="chart-label">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="chart-loading">
            <p>Loading chart data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
