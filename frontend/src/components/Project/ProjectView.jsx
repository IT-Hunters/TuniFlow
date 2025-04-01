import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProjectView.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/users'; // Replace with your backend URL

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
          headers: { Authorization: `Bearer ${token}` },
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
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container error">
        <h3>Oops, Something Went Wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="action-btn retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="state-container empty">
        <h3>No Project Assigned</h3>
        <p>You are not currently assigned to any project.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="project-view-wrapper">
          <header className="project-header">
            <h1 className="project-title">
              {project.name || `Project ${project._id?.slice(-4) || 'Unnamed'}`}
            </h1>
          </header>

          <section className="project-layout">
            {/* Project Details Card */}
            <div className="detail-card">
              <h2 className="card-title">Project Details</h2>
              <ul className="detail-list">
                <li className="detail-item">
                  <span className="label">Status</span>
                  <span className={`status ${project.status?.toLowerCase() || ''}`}>
                    {project.status || 'N/A'}
                  </span>
                </li>
                <li className="detail-item">
                  <span className="label">Budget</span>
                  <span>
                    {project.amount ? `$${project.amount.toLocaleString()}` : 'Not specified'}
                  </span>
                </li>
                <li className="detail-item">
                  <span className="label">Due Date</span>
                  <span>
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : 'Ongoing'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Team Members Card */}
            <div className="team-card">
              <h2 className="card-title">Team Members</h2>
              <div className="team-grid">
                <div className="team-item">
                  <h3 className="team-role">Business Owner</h3>
                  <p className="team-name">
                    {project.businessOwner?.fullname || 'Not assigned'}
                  </p>
                </div>
                <div className="team-item">
                  <h3 className="team-role">Accountants</h3>
                  {project.teamMembers?.accountants?.length > 0 ? (
                    project.teamMembers.accountants.map((acc) => (
                      <p key={acc._id} className="team-name">{acc.fullname}</p>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
                <div className="team-item">
                  <h3 className="team-role">Financial Managers</h3>
                  {project.teamMembers?.financialManagers?.length > 0 ? (
                    project.teamMembers.financialManagers.map((fm) => (
                      <p key={fm._id} className="team-name">{fm.fullname}</p>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
                <div className="team-item">
                  <h3 className="team-role">HR Managers</h3>
                  {project.teamMembers?.rhManagers?.length > 0 ? (
                    project.teamMembers.rhManagers.map((rh) => (
                      <p key={rh._id} className="team-name">{acc.fullname}</p>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;