"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./TeamActivity.css";
import LogService from "../../../services/LogsService"; 
export default function TeamActivity({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions to handle data formatting
  const mapAction = (action) => {
    const actionMap = {
      created: "created",
      updated: "updated",
      commented: "commented on",
      completed: "completed",
      assigned: "assigned",
    };
    return actionMap[action?.toLowerCase()] || action || "performed action";
  };

  const getProjectName = (projectId) => {
    return projectId || "Unknown Project";
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 1000 / 60);
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } catch {
      return timestamp || "Unknown time";
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log('useEffect triggered with projectId:', projectId);

    const fetchActivities = async () => {
      if (!isMounted) return;
      console.log('Fetching activities for projectId:', projectId);
      setLoading(true);
      setError(null);
      try {
        const logs = await LogService.getLogsByProject(projectId);
        if (!isMounted) return;
        const mappedActivities = logs.map((log) => ({
          id: log.id,
          user: {
            name: log.user?.name || "Unknown User",
            department: log.user?.department || "Unknown",
          },
          action: mapAction(log.action),
          description: log.description,
          timestamp: formatTimestamp(log.timestamp),
        }));
        console.log("Mapped activities: ", mappedActivities);
        setActivities(mappedActivities);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load team activity:", err);
        setError("Failed to load activities. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (projectId) {
      fetchActivities();
    } else {
      setLoading(false);
      setError("No project ID provided.");
    }

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h2 className="activity-title">Team Activity</h2>
        <p className="activity-description">Recent activity from your team members</p>
      </div>
      <div className="activity-scroll-panel">
        {loading ? (
          <div className="activity-loading">
            <p>Loading team activity...</p>
          </div>
        ) : error ? (
          <div className="activity-error">
            <p>{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="activity-empty">
            <p>No activities found for this project.</p>
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
                    <span className="activity-action">{activity.description}</span>{" "}
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

TeamActivity.propTypes = {
  projectId: PropTypes.string.isRequired,
};
