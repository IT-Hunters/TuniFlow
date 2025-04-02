"use client";

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "./ProjectsOverview.css";
import { getObjectifs } from "../../../services/ObjectifService";

export default function ProjectsOverview({ selectedRole, projectId }) {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await getObjectifs(selectedRole, projectId);

        if (response.success) {
          // Combine ongoing projects and completedToday into one array
          const combinedProjects = [
            ...(response.data || []),
            ...(response.completedToday || [])
          ];
          setAllProjects(combinedProjects);
        } else {
          setAllProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedRole, projectId]);

  // Memoize status icon function to prevent unnecessary recalculations
  const getStatusIcon = useMemo(() => {
    return (status, budgetStatus) => {
      if (status === "InProgress") {
        if (budgetStatus === "AtRisk") return "⚠️";
        if (budgetStatus === "CloseToLimit") return "⏳";
        return "📊";
      }
      if (status === "Completed") return "✅";
      if (status === "Failed") return "❌";
      return "";
    };
  }, []);

  // Separate component for project item to improve readability
  const ProjectItem = ({ project }) => (
    <div className="project-item">
      <div className="project-header">
        <div className="project-title-container">
          <span className="project-status-icon">
            {getStatusIcon(project.status, project.budgetStatus)}
          </span>
          <h3 className="project-title">{project.name}</h3>
        </div>
        <div className={`project-status ${project.status.toLowerCase()}`}>
          {project.status} {project.budgetStatus !== "WithinBudget" && `(${project.budgetStatus})`}
        </div>
      </div>

      <div className="project-progress">
        <div className="progress-header">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${project.progress}%` ,background: `#3b82f6`}}
          />
        </div>
      </div>

      <div className="project-details">
        <div className="project-detail">
          <p className="detail-label">Objective Type</p>
          <p className="detail-value">{project.department}</p>
        </div>
        <div className="project-detail">
          <p className="detail-label">Due Date</p>
          <p className="detail-value">{new Date(project.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="project-detail">
          <p className="detail-label">Budget Pattern</p>
          <p className="detail-value">
            {project.maxBudget !== undefined && project.minBudget !== undefined
              ? `${project.minBudget.toLocaleString()} TND  -  ${project.maxBudget.toLocaleString()} TND`
              : "N/A"}
          </p>
        </div>
        <div className="project-detail">
          <p className="detail-label">Spent</p>
          <p className="detail-value">
            ${project.spent.toLocaleString()} (
            {project.progress !== undefined ? project.progress : "N/A"}%)
          </p>
        </div>
      </div>
    </div>
  );

  // Render content based on loading state and data availability
  const renderContent = () => {
    if (loading) {
      return (
        <div className="projects-loading">
          <p>Loading projects...</p>
        </div>
      );
    }
    
    if (allProjects.length === 0) {
      return (
        <div className="projects-empty">
          <p>No projects found for the selected criteria</p>
        </div>
      );
    }
    
    return (
      <div className="projects-list">
        {allProjects.map(project => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <div className="projects-card">
      <div className="projects-header">
        <h2 className="projects-title">Objectives Overview</h2>
        <p className="projects-description">Track your active projects objectives across all types</p>
      </div>
      <div className="projects-content">
        {renderContent()}
      </div>
    </div>
  );
}

ProjectsOverview.propTypes = {
  selectedRole: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired
};