"use client";

import { useEffect, useState } from "react";
import "./TeamActivity.css";

export default function TeamActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching activities
    setTimeout(() => {
      const mockActivities = [
        {
          id: "1",
          user: {
            name: "Sarah Johnson",
            department: "Finance",
          },
          action: "completed",
          project: "Annual Budget Review",
          timestamp: "15 minutes ago",
        },
        {
          id: "2",
          user: {
            name: "Michael Chen",
            department: "HR",
          },
          action: "commented on",
          project: "Employee Onboarding Process",
          timestamp: "1 hour ago",
        },
        {
          id: "3",
          user: {
            name: "Aisha Patel",
            department: "Accounting",
          },
          action: "updated",
          project: "Q3 Financial Report",
          timestamp: "3 hours ago",
        },
        {
          id: "4",
          user: {
            name: "Robert Kim",
            department: "IT",
          },
          action: "created",
          project: "System Integration Task",
          timestamp: "5 hours ago",
        },
        {
          id: "5",
          user: {
            name: "Emma Wilson",
            department: "Finance",
          },
          action: "assigned",
          project: "Budget Forecasting",
          timestamp: "1 day ago",
        },
      ];
      setActivities(mockActivities);
      setLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h2 className="activity-title">Team Activity</h2>
        <p className="activity-description">Recent activity from your team members</p>
      </div>
      <div className="activity-content">
        {loading ? (
          <div className="activity-loading">
            <p>Loading team activity...</p>
          </div>
        ) : (
          <div className="activity-list">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-avatar">
                  {activity.user.avatar ? (
                    <img
                      src={activity.user.avatar || "/placeholder.svg"}
                      alt={activity.user.name}
                    />
                  ) : (
                    <div className="avatar-fallback">
                      {activity.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                </div>
                <div className="activity-details">
                  <p className="activity-text">
                    <span className="user-name">{activity.user.name}</span>{" "}
                    <span className="user-department">({activity.user.department})</span>{" "}
                    <span className="activity-action">{activity.action}</span>{" "}
                    <span className="project-name">{activity.project}</span>
                  </p>
                  <p className="activity-time">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
