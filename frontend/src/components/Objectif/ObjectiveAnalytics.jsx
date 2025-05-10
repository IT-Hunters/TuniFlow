import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  Filler,
  annotationPlugin
);

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
    for (let i = 1; i < history.length; i++) {
      const previous = history[i - 1];
      const current = history[i];
      const progressChange = current.progress - previous.progress;
      const progressChangePercent = (progressChange / (previous.progress || 1)) * 100;
      if (Math.abs(progressChangePercent) > 30) {
        foundAnomalies.push({
          date: current.date,
          progress: current.progress,
          changePercent: progressChangePercent.toFixed(2),
        });
      }
    }
    setAnomalies(foundAnomalies);
  };

  if (loading) return <div className="analytics-loading">Loading Analytics...</div>;
  if (!analytics) return <div className="analytics-error">No analytics data available.</div>;

  const chartData = {
    datasets: [
      {
        label: 'Progress Over Time',
        data: analytics.progressHistory.map(entry => ({
          x: new Date(entry.date),
          y: entry.progress,
        })),
        borderColor: '#5a67d8',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(90, 103, 216, 0.3)');
          gradient.addColorStop(1, 'rgba(90, 103, 216, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: analytics.progressHistory.map(entry => {
          const isAnomaly = anomalies.find(anomaly => anomaly.date === entry.date);
          return isAnomaly ? '#f56565' : '#5a67d8';
        }),
        pointRadius: analytics.progressHistory.map(entry => {
          const isAnomaly = anomalies.find(anomaly => anomaly.date === entry.date);
          return isAnomaly ? 8 : 4;
        }),
        borderWidth: 2,
        segment: {
          borderColor: ctx => {
            const i = ctx.p0DataIndex;
            const isAnomaly = anomalies.find(anomaly => analytics.progressHistory[i+1] && anomaly.date === analytics.progressHistory[i+1].date);
            return isAnomaly ? '#f56565' : '#5a67d8';
          },
          borderDash: ctx => {
            const i = ctx.p0DataIndex;
            const isAnomaly = anomalies.find(anomaly => analytics.progressHistory[i+1] && anomaly.date === analytics.progressHistory[i+1].date);
            return isAnomaly ? [8, 6] : undefined;
          }
        }
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day' },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Progress (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold',
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1a202c',
        bodyColor: '#1a202c',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 14,
        },
        callbacks: {
          label: (context) => {
            const anomaly = anomalies.find(a => new Date(a.date).getTime() === context.parsed.x.getTime());
            let label = `Progress: ${context.parsed.y}%`;
            if (anomaly) {
              label += ` (Anomaly: ${anomaly.changePercent}% change)`;
            }
            return label;
          },
        },
        displayColors: true,
        mode: 'nearest',
        intersect: false,
      },
      annotation: {
        annotations: anomalies.map((anomaly, idx) => ({
          type: 'line',
          scaleID: 'x',
          value: new Date(anomaly.date),
          borderColor: '#f56565',
          borderWidth: 2,
          borderDash: [6, 6],
          label: {
            content: `Anomaly (${anomaly.changePercent}%)`,
            enabled: true,
            position: 'start',
            backgroundColor: '#f56565',
            color: '#fff',
            font: { size: 10, weight: 'bold' },
            yAdjust: -20,
          },
        }))
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: false,
    },
  };

  return (
    <div className="analytics-dashboard analytics-slide-in">
      <div className="analytics-header">
        <h2>Objective Analytics</h2>
        <div className="analytics-summary">
          <div className="analytics-metric time-remaining">
            <span className="metric-label">Time Remaining</span>
            <span className="metric-value">{analytics.timeRemaining} days</span>
          </div>
          <div className="analytics-metric failure-risk">
            <span className="metric-label">Failure Risk</span>
            <span className={`metric-value ${analytics.failureRisk.toLowerCase()}`}>
              {analytics.failureRisk}
            </span>
          </div>
          {prediction !== null && (
            <div className="analytics-metric prediction">
              <span className="metric-label">Prediction</span>
              <span className={`metric-value ${prediction ? 'success' : 'danger'}`}>
                {prediction ? 'Will Complete' : 'Will Not Complete'}
              </span>
            </div>
          )}
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="anomalies-section">
          <h3>
            <span className="anomaly-icon">⚠</span>
            Anomalies Detected
          </h3>
          <div className="anomalies-list">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="anomaly-item">
                <div className="anomaly-date">
                  {new Date(anomaly.date).toLocaleDateString()}
                </div>
                <div className="anomaly-details">
                  <span className="anomaly-progress">Progress: {anomaly.progress}%</span>
                  <span className="anomaly-change">Change: {anomaly.changePercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="progress-chart">
        <h3>Progress Over Time</h3>
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} height={400} />
        </div>
      </div>
    </div>
  );
};

export default ObjectiveAnalytics;
