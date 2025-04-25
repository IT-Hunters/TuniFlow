import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

const ObjectiveAnalytics = ({ objectiveId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    const fetchAnalyticsAndPrediction = async () => {
      setLoading(true);
      try {
        const analyticsResponse = await axios.get(`http://localhost:3000/objectif/analytics/${objectiveId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = analyticsResponse.data;
        setAnalytics(data);

        // Fetch prediction
        const predictionResponse = await axios.post('http://localhost:8000/predict-completion', {
          target_amount: data.targetAmount,
          minbudget: data.minBudget,
          maxbudget: data.maxBudget,
          current_progress: data.currentProgress,
          avg_weekly_progress: data.avgWeeklyProgress,
          objectivetype: data.objectiveType,
        });
        setPrediction(predictionResponse.data.completed);

        // Detect anomalies
        if (data.progressHistory.length > 1) {
          detectAnomalies(data.progressHistory);
        }
      } catch (error) {
        console.error('Error fetching analytics or prediction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsAndPrediction();
  }, [objectiveId]);

  const detectAnomalies = (history) => {
    const foundAnomalies = [];

    // Debug: Check if the progress data is correct
    console.log("Progress history data:", history);

    for (let i = 1; i < history.length; i++) {
      const previous = history[i - 1];
      const current = history[i];

      const progressChange = current.progress - previous.progress;
      const progressChangePercent = (progressChange / (previous.progress || 1)) * 100;

      // Debug: Log the change between progress
      console.log(`Progress change from ${previous.progress}% to ${current.progress}%, change: ${progressChangePercent}%`);

      if (Math.abs(progressChangePercent) > 30) {
        foundAnomalies.push({
          date: current.date,
          progress: current.progress,
          changePercent: progressChangePercent.toFixed(2),
        });
      }
    }

    console.log('Detected anomalies:', foundAnomalies); // Log anomalies
    setAnomalies(foundAnomalies);
  };

  if (loading) return <div>Loading Analytics...</div>;
  if (!analytics) return <div>No analytics data available.</div>;

  const chartData = {
    datasets: [
      {
        label: 'Progress Over Time',
        data: analytics.progressHistory.map(entry => ({
          x: new Date(entry.date),
          y: entry.progress,
        })),
        borderColor: '#5a67d8',
        backgroundColor: 'rgba(90, 103, 216, 0.2)',
        fill: true,
        pointBackgroundColor: analytics.progressHistory.map(entry => {
          const isAnomaly = anomalies.find(anomaly => anomaly.date === entry.date);
          return isAnomaly ? '#f56565' : '#5a67d8';
        }),
        pointRadius: analytics.progressHistory.map(entry => {
          const isAnomaly = anomalies.find(anomaly => anomaly.date === entry.date);
          return isAnomaly ? 8 : 4;
        }),
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { type: 'time', time: { unit: 'day' }, title: { display: true, text: 'Date' } },
      y: { min: 0, max: 100, title: { display: true, text: 'Progress (%)' } },
    },
    plugins: {
      legend: { labels: { font: { size: 16 } } },
      tooltip: { bodyFont: { size: 14 } },
    },
  };

  return (
    <div className="analytics-dashboard analytics-slide-in">
      <h2>Objective Analytics</h2>

      <div className="analytics-content">
        <p><strong>Time Remaining:</strong> {analytics.timeRemaining} days</p>
        <p><strong>Failure Risk:</strong> 
          <span style={{ color: analytics.failureRisk === 'High' ? '#f56565' : '#48bb78' }}>
            {analytics.failureRisk}
          </span>
        </p>

        {prediction !== null && (
          <p><strong>Prediction:</strong> 
            <span style={{ color: prediction ? '#48bb78' : '#f56565' }}>
              {prediction ? 'Will Complete' : 'Will Not Complete'}
            </span>
          </p>
        )}

        {anomalies.length > 0 && (
          <div className="anomalies-section">
            <h3 style={{ color: '#f56565' }}>⚠ Anomalies Detected</h3>
            <ul>
              {anomalies.map((anomaly, idx) => (
                <li key={idx}>
                  <strong>Date:</strong> {new Date(anomaly.date).toLocaleDateString()} - 
                  <strong> Progress:</strong> {anomaly.progress}% 
                  (<strong>{anomaly.changePercent}%</strong> change)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="progress-chart">
          <h3>Progress Over Time</h3>
          <Line data={chartData} options={chartOptions} height={400} />
        </div>
      </div>
    </div>
  );
};

export default ObjectiveAnalytics;
