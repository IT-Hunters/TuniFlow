import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './OwnerProjectsView.css'; // Fichier CSS séparé

const API_URL = 'http://localhost:3000'; // Remplacez par votre URL backend

const OwnerProjectsView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/users/findMyProjectsOwner`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setProjects(response.data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.response?.data?.message || 'Failed to load projects');
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Projects</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="no-projects-container">
        <h3>No Projects Found</h3>
        <p>You haven't created any projects yet.</p>
        <button 
          onClick={() => navigate('/create-project')}
          className="create-project-button"
        >
          Create New Project
        </button>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <h1 className="projects-header">My Projects</h1>
      
      <div className="projects-grid">
        {projects.map(project => (
          <div key={project._id} className="project-card">
            <h2 className="project-name">{project.name || `Project ${project._id.toString().slice(-4)}`}</h2>
            
            <div className="project-details">
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Budget:</span>
                <span className="detail-value">
                  {project.amount ? `$${project.amount.toLocaleString()}` : 'Not specified'}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">
                  {project.due_date 
                    ? new Date(project.due_date).toLocaleDateString() 
                    : 'Ongoing'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/projects/${project._id}`)}
              className="view-details-button"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerProjectsView;