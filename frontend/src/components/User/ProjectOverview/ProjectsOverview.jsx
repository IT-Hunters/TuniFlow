"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ProjectsOverview.css";

export default function ProjectsOverview({ selectedRole }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mockProjects = [
        {
          id: "1",
          name: "Financial Software Implementation",
          status: "in-progress",
          progress: 65,
          department: "Finance",
          dueDate: "2023-12-15",
          budget: 50000,
          spent: 32500,
        },
        {
          id: "2",
          name: "HR System Upgrade",
          status: "at-risk",
          progress: 40,
          department: "HR",
          dueDate: "2023-11-30",
          budget: 35000,
          spent: 20000,
        },
        {
          id: "3",
          name: "Quarterly Reporting Dashboard",
          status: "completed",
          progress: 100,
          department: "Accounting",
          dueDate: "2023-10-15",
          budget: 15000,
          spent: 14750,
        },
        {
          id: "4",
          name: "Payroll System Integration",
          status: "delayed",
          progress: 30,
          department: "Finance",
          dueDate: "2023-11-01",
          budget: 28000,
          spent: 12000,
        },
      ];

      const filteredProjects =
        selectedRole === "all"
          ? mockProjects
          : mockProjects.filter((p) => p.department.toLowerCase() === selectedRole.toLowerCase());

      setProjects(filteredProjects);
      setLoading(false);
    }, 1000);
  }, [selectedRole]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "in-progress":
        return "📊";
      case "completed":
        return "✅";
      case "at-risk":
        return "⚠️";
      case "delayed":
        return "⏰";
      default:
        return "";
    }
  };

  return (
    <div className="projects-card">
      <div className="projects-header">
        <h2 className="projects-title">Projects Overview</h2>
        <p className="projects-description">Track your active projects across departments</p>
      </div>
      <div className="projects-content">
        {loading ? (
          <div className="projects-loading">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="projects-empty">
            <p>No projects found for the selected role</p>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map((project) => (
              <div key={project.id} className="project-item">
                <div className="project-header">
                  <div className="project-title-container">
                    <span className="project-status-icon">{getStatusIcon(project.status)}</span>
                    <h3 className="project-title">{project.name}</h3>
                  </div>
                  <div className={`project-status ${project.status}`}>
                    {project.status.replace("-", " ")}
                  </div>
                </div>

                <div className="project-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                <div className="project-details">
                  <div className="project-detail">
                    <p className="detail-label">Department</p>
                    <p className="detail-value">{project.department}</p>
                  </div>
                  <div className="project-detail">
                    <p className="detail-label">Due Date</p>
                    <p className="detail-value">{new Date(project.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="project-detail">
                    <p className="detail-label">Budget</p>
                    <p className="detail-value">${project.budget.toLocaleString()}</p>
                  </div>
                  <div className="project-detail">
                    <p className="detail-label">Spent</p>
                    <p className="detail-value">
                      ${project.spent.toLocaleString()} (
                      {Math.round((project.spent / project.budget) * 100)}%)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

ProjectsOverview.propTypes = {
  selectedRole: PropTypes.string.isRequired,
};