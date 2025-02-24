import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fetchWorkingCapital = async (projectId) => {
  try {
    const response = await fetch(`/api/working-capital/${projectId}`); 
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error("Error fetching working capital data:", error);
    return [];
  }
};

const getRiskLevel = (data) => {
  if (data.length < 2) return "Unknown";

  const latest = data[data.length - 1].value;
  const previous = data[data.length - 2].value;

  if (latest < 0) return "Critical (Red)";
  if (latest > previous && latest > 75000) return "Stable (Green)";
  if (latest < previous && latest < 50000) return "Declining (Red)";
  return "Moderate (Orange)";
};

const getBarColor = (value) => {
  if (value > 75000) return "#28a745"; // Green: Good financial health
  if (value > 50000) return "#ffc107"; // Orange: Moderate risk
  return "#dc3545"; // Red: Critical
};

const WorkingCapitalDashboard = ({ projectId }) => {
  const [workingCapitalData, setWorkingCapitalData] = useState([]);
  const [riskLevel, setRiskLevel] = useState("Loading...");

  useEffect(() => {
    async function loadData() {
      const data = await fetchWorkingCapital(projectId);
      setWorkingCapitalData(data);
      setRiskLevel(getRiskLevel(data));
    }
    loadData();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <h2 className="text-xl font-semibold">Working Capital Status</h2>
      <p className="text-lg font-bold mt-2">
        ${workingCapitalData.length > 0 ? workingCapitalData[workingCapitalData.length - 1].value.toLocaleString() : "N/A"}
      </p>
      <p className="text-md mt-2 font-medium text-gray-700">Risk Level: <span className="font-bold">{riskLevel}</span></p>

      {/* Bar Chart */}
      <h2 className="text-xl font-semibold mb-4">Working Capital Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={workingCapitalData}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {workingCapitalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkingCapitalDashboard;
