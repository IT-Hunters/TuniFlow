// ProjectsOverview.jsx
import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "./ProjectsOverview.css";
import { getObjectifs } from "../../../services/ObjectifService";

export default function ProjectsOverview({ projectId }) {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Add error state

  console.log('Received projectId:', projectId);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(''); // Reset error
      try {
        const response = await getObjectifs(projectId);
        console.log('getObjectifs response:', response);

        if (response.success && response.objectifs) {
          const mappedProjects = response.objectifs.map(obj => ({
            id: obj._id || '',
            name: obj.name || 'Unnamed Objective',
            progress: obj.progress || 0,
            status: obj.status || 'InProgress',
            budgetStatus: calculateBudgetStatus(obj),
            department: obj.objectivetype || 'N/A',
            dueDate: obj.datefin || new Date(),
            minBudget: obj.minbudget || 0,
            maxBudget: obj.maxbudget || 0,
            spent: calculateSpent(obj),
          }));
          console.log('Mapped projects:', mappedProjects);
          setAllProjects(mappedProjects);
        } else {
          setAllProjects([]);
          setError('No objectives found in the response');
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error.response?.data?.message || 'Failed to fetch objectives');
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && /^[0-9a-fA-F]{24}$/.test(projectId)) {
      fetchProjects();
    } else {
      setError('Invalid project ID');
      setLoading(false);
    }
  }, [projectId]);

  const calculateBudgetStatus = (objective) => {
    const spent = calculateSpent(objective);
    const maxBudget = objective.maxbudget || 0;
    if (maxBudget === 0) return "WithinBudget";
    if (spent > maxBudget) return "AtRisk";
    if (spent > maxBudget * 0.9) return "CloseToLimit";
    return "WithinBudget";
  };

  const calculateSpent = (objective) => {
    const maxBudget = objective.maxbudget || 0;
    const progress = objective.progress || 0;
    return Math.round((progress / 100) * maxBudget);
  };

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
            style={{ width: `${Math.min(project.progress, 100)}%`, background: '#3b82f6' }}
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
              ? `${project.minBudget.toLocaleString()} TND - ${project.maxBudget.toLocaleString()} TND`
              : "N/A"}
          </p>
        </div>
        <div className="project-detail">
          <p className="detail-label">Spent</p>
          <p className="detail-value">
            {project.spent.toLocaleString()} TND (
            {project.progress !== undefined ? project.progress : "N/A"}%)
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="projects-loading">
          <p>Loading objectives...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="projects-error">
          <p>{error}</p>
        </div>
      );
    }
    
    if (allProjects.length === 0) {
      return (
        <div className="projects-empty">
          <p>No objectives found for the selected project</p>
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
        <p className="projects-description">Track your active project objectives across all types</p>
      </div>
      <div className="projects-content">
        {renderContent()}
      </div>
    </div>
  );
}

ProjectsOverview.propTypes = {
  projectId: PropTypes.string.isRequired
};