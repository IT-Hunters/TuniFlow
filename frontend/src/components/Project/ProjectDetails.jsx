import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProjectDetails.css'; // Fichier CSS séparé

const API_URL = 'http://localhost:3000/project/getbyid'; // Votre URL backend

const ProjectDetails = () => {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setProject(response.data);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err.response?.data?.message || 'Failed to load project details');
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        navigate('/projects', { state: { message: 'Project deleted successfully' } });
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
        <Link to="/projects" className="back-link">
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="not-found-container">
        <h3>Project Not Found</h3>
        <p>The requested project could not be found.</p>
        <Link to="/projects" className="back-link">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-details-container">
      <div className="header-section">
        <h1 className="project-title">{project.name || `Project ${project._id.slice(-4)}`}</h1>
        <div className="action-buttons">
          <Link 
            to={`/projects/${id}/edit`} 
            className="edit-button"
          >
            Edit Project
          </Link>
          <button 
            onClick={handleDelete}
            className="delete-button"
          >
            Delete Project
          </button>
        </div>
      </div>

      <div className="project-content">
        <div className="main-details">
          <div className="detail-card">
            <h3 className="detail-title">Basic Information</h3>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${project.status.toLowerCase()}`}>
                {project.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Budget:</span>
              <span className="detail-value">
                {project.amount ? `$${project.amount.toLocaleString()}` : 'Not specified'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Start Date:</span>
              <span className="detail-value">
                {new Date(project.startDate || project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End Date:</span>
              <span className="detail-value">
                {project.endDate 
                  ? new Date(project.due-date).toLocaleDateString() 
                  : 'Ongoing'}
              </span>
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-title">Description</h3>
            <p className="project-description">
              {project.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="team-section">
          <h2 className="section-title">Team Members</h2>
          
          <div className="team-grid">
            <div className="team-card">
              <h4 className="team-title">Business Owner</h4>
              <p className="team-member">
                {project.businessOwner?.fullname || 'Not assigned'}
              </p>
              <p className="team-email">
                {project.businessOwner?.email || ''}
              </p>
            </div>

            <div className="team-card">
              <h4 className="team-title">Business Manager</h4>
              <p className="team-member">
                {project.businessManager?.fullname || 'Not assigned'}
              </p>
              <p className="team-email">
                {project.businessManager?.email || ''}
              </p>
            </div>

            <div className="team-card">
              <h4 className="team-title">Accountants</h4>
              <ul className="team-list">
                {project.accountants?.length > 0 ? (
                  project.accountants.map(acc => (
                    <li key={acc._id}>
                      <p className="team-member">{acc.fullname}</p>
                      <p className="team-email">{acc.email}</p>
                    </li>
                  ))
                ) : <li className="no-member">None assigned</li>}
              </ul>
            </div>

            <div className="team-card">
              <h4 className="team-title">Financial Managers</h4>
              <ul className="team-list">
                {project.financialManagers?.length > 0 ? (
                  project.financialManagers.map(fm => (
                    <li key={fm._id}>
                      <p className="team-member">{fm.fullname}</p>
                      <p className="team-email">{fm.email}</p>
                    </li>
                  ))
                ) : <li className="no-member">None assigned</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Link to="/OwnerProjectsView" className="back-link">
        &larr; Back to All Projects
      </Link>
    </div>
  );
};

export default ProjectDetails;