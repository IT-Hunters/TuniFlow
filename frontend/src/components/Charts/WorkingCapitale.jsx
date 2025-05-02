import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchWorkingCapital } from "../../services/AssetCalculationService";

const getRiskLevel = (value) => {
  if (value < 0) return "Critical";
  if (value > 15000) return "Stable";
  if (value < 5000) return "Declining";
  return "Moderate ";
};

const getBarColor = (value) => {
  if (value > 15000) return "#28a745"; 
  if (value > 5000) return "#ffc107"; 
  return "#dc3545"; 
};

const formatDate = (dateString) => {
  return new Date(dateString).toISOString().split("T")[0]; 
};

const WorkingCapitalDashboard = ({ projectId }) => {
  const [workingCapitalData, setWorkingCapitalData] = useState([]);
  const [riskLevel, setRiskLevel] = useState("Loading...");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchWorkingCapital(localStorage.getItem("userId"));
        if (!response || !response.workingCapitalByDate) {
          throw new Error("No data received from API");
        }

        const sortedData = response.workingCapitalByDate
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5) 
          .reverse() 
          .map((entry) => ({
            ...entry,
            date: formatDate(entry.date), 
          }));

        setWorkingCapitalData(sortedData);
        setRiskLevel(getRiskLevel(sortedData[sortedData.length - 1]?.workingCapital || 0));
      } catch (error) {
        console.error("Error fetching working capital:", error);
      }
    }

    loadData();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <p className="text-xl font-semibold">Working Capital Status</p>
      <h1 className="Big-Numbers">
        ${workingCapitalData.length > 0 ? workingCapitalData[workingCapitalData.length - 1].workingCapital.toLocaleString() : "N/A"}
      </h1>
      <p className="text-md mt-2 font-medium text-gray-700">Risk Level: <span className="font-bold">{riskLevel}</span></p>

      <h4 className="text-xl font-semibold mb-4">Last 5 Days - Working Capital Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={workingCapitalData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="workingCapital">
            {workingCapitalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.workingCapital)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkingCapitalDashboard;
