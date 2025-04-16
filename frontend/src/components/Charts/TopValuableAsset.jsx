import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

const colors = ["#4F46E5", "#34D399", "#F59E0B", "#EF4444", "#6366F1"]; 

const TopValuableAssetsChart = ({ assets }) => {
  const data = assets.map((asset) => ({
    name: asset.name,
    value: asset.total_value, 
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart layout="vertical" data={data} margin={{ left: 20 }}>
        <XAxis type="number" axisLine={false} tick={false} />
        <YAxis type="category" dataKey="name" axisLine={false} tick={{ fill: "#333", fontSize: 14 }} />
        <Tooltip />
        <Bar dataKey="value" barSize={15} radius={[10, 10, 10, 10]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.7} />
          ))}
          <LabelList dataKey="value" position="right" fill="#000" fontSize={14} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopValuableAssetsChart;
