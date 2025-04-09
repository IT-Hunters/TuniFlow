import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns'; // For date handling in charts

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

const ObjectiveAnalytics = ({ objectiveId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/objectif/analytics/${objectiveId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [objectiveId]);

  if (loading) return <div className="loading">Loading Analytics...</div>;
  if (!analytics) return <div>No analytics data available.</div>;

  const chartData = {
    datasets: [
      {
        label: 'Progress Over Time',
        data: analytics.progressHistory.map((entry) => ({
          x: new Date(entry.date),
          y: entry.progress,
        })),
        borderColor: '#5a67d8', // Match primary color
        backgroundColor: 'rgba(90, 103, 216, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { type: 'time', time: { unit: 'day' } },
      y: { min: 0, max: 100, title: { display: true, text: 'Progress (%)' } },
    },
  };

  return (
    <div className="analytics-dashboard">
      <h2>Objective Analytics</h2>
      <div className="analytics-content">
        <p>Success Rate of Similar Objectives: {analytics.successRate.toFixed(2)}%</p>
        <p>Time Remaining: {analytics.timeRemaining} days</p>
        <p>Failure Risk: <span style={{ color: analytics.failureRisk === 'High' ? '#f56565' : '#48bb78' }}>{analytics.failureRisk}</span></p>
        {analytics.progressHistory.length > 0 && (
          <div className="progress-chart">
            <h3>Progress Over Time</h3>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectiveAnalytics;