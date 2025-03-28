import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProjectView.css'; // Import du fichier CSS séparé

const API_URL = 'http://localhost:3000/users'; // Remplacez par votre URL backend

const ProjectView = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/findMyProject`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setProject(response.data);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.response?.data?.message || 'Failed to load project');
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="no-project-message">
        <p>No project found for your account.</p>
      </div>
    );
  }

  // Fonction pour déterminer la classe du badge de statut
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  return (
    <div className="project-container">
      <h1 className="project-title">My Project</h1>
      
      <div className="project-card">
        
        
        <div className="details-grid">
         
          
          <div className="detail-group">
            <h3 className="detail-label">Status</h3>
            <p className="detail-value">
              <span className={`status-badge ${getStatusClass(project.status)}`}>
                {project.status}
              </span>
            </p>
          </div>
          
          <div className="detail-group">
            <h3 className="detail-label">Budget</h3>
            <p className="detail-value">
              {project.amount ? `$${project.amount.toLocaleString()}` : 'Not specified'}
            </p>
          </div>
          
          
          <div className="detail-group">
            <h3 className="detail-label">Due Date</h3>
            <p className="detail-value">
              {project.endDate 
                ? new Date(project.endDate).toLocaleDateString() 
                : 'Ongoing'}
            </p>
          </div>
        </div>

        {/* Section Team Members */}
        <div className="team-section">
          <h3 className="section-title">Team Members</h3>
          
          <div className="team-grid">
            <div className="team-group">
              <h4 className="team-label">Business Owner</h4>
              <p className="team-value">
                {project.businessOwner?.fullname || 'Not assigned'}
              </p>
            </div>
            
            <div className="team-group">
              <h4 className="team-label">Accountants</h4>
              <ul className="team-list">
                {project.teamMembers?.accountants?.length > 0 ? (
                  project.teamMembers.accountants.map(acc => (
                    <li key={acc._id}>{acc.fullname}</li>
                  ))
                ) : <li>None assigned</li>}
              </ul>
            </div>
            
            <div className="team-group">
              <h4 className="team-label">Financial Managers</h4>
              <ul className="team-list">
                {project.teamMembers?.financialManagers?.length > 0 ? (
                  project.teamMembers.financialManagers.map(fm => (
                    <li key={fm._id}>{fm.fullname}</li>
                  ))
                ) : <li>None assigned</li>}
              </ul>
            </div>
            
            <div className="team-group">
              <h4 className="team-label">HR Managers</h4>
              <ul className="team-list">
                {project.teamMembers?.rhManagers?.length > 0 ? (
                  project.teamMembers.rhManagers.map(rh => (
                    <li key={rh._id}>{rh.fullname}</li>
                  ))
                ) : <li>None assigned</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;