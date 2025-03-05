"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getDailyLogins } from "../../services/UserLogsService"
import './getDailyLogins.css'
const LoginChart = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await getDailyLogins()
        // Format dates for better display
        const formattedData = response.map((item) => ({
          ...item,
          // Convert date string to more readable format
          login_date: new Date(item.login_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }))
        setLogs(formattedData)
      } catch (err) {
        setError("Failed to load login data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div className="chart-loading">
        <h2>Loading login statistics...</h2>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return <div className="chart-error">{error}</div>
  }

  return (
    <div className="chart-container">
      <h1>Daily Login Statistics</h1>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={logs} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4285F4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4285F4" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="login_date" tick={{ fill: "#666" }} tickLine={{ stroke: "#666" }} />
            <YAxis
              tick={{ fill: "#666" }}
              tickLine={{ stroke: "#666" }}
              width={60}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value) => [value.toLocaleString(), "Users"]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="total_users"
              name="Total Users"
              stroke="#0066CC"
              strokeWidth={3}
              fill="url(#colorUsers)"
              fillOpacity={1}
              dot={{ r: 4, fill: "#0066CC", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#0066CC", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default LoginChart

