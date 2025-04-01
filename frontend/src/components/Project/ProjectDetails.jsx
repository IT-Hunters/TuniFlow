import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProjectDetails.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/project/getbyid'; // Your backend URL

const ProjectDetails = () => {
  const { id } = useParams();
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
          headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate('/OwnerProjectsView', { state: { message: 'Project deleted successfully' } });
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Loading project details...</p>
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
        <Link to="/OwnerProjectsView" className="back-link">Back to Projects</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="state-container not-found">
        <h3>Project Not Found</h3>
        <p>The requested project could not be found.</p>
        <Link to="/OwnerProjectsView" className="back-link">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="project-details-wrapper">
          <Link to="/OwnerProjectsView" className="back-link">
            ← Back to All Projects
          </Link>
          <header className="project-header">
            <h1 className="project-title">
              {project.name || `Project ${project._id.slice(-4)}`}
            </h1>
            <div className="action-buttons">
              <Link to={`/projects/${id}/edit`} className="action-btn edit-btn">
                Edit Project
              </Link>
              <button onClick={handleDelete} className="action-btn delete-btn">
                Delete Project
              </button>
            </div>
          </header>

          <div className="project-layout">
            {/* Left Column: Project Details */}
            <section className="project-details">
              <div className="detail-card">
                <h2 className="card-title">Project Information</h2>
                <ul className="detail-list">
                  <li className="detail-item">
                    <span className="label">Status</span>
                    <span className={`status ${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Budget</span>
                    <span>
                      {project.amount ? `$${project.amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Start Date</span>
                    <span>
                      {new Date(project.startDate || project.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                  <li className="detail-item">
                    <span className="label">End Date</span>
                    <span>
                      {project.due_date
                        ? new Date(project.due_date).toLocaleDateString()
                        : 'Ongoing'}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="detail-card">
                <h2 className="card-title">Description</h2>
                <p className="description">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </section>

            {/* Right Column: Team Members */}
            <aside className="team-section">
              <h2 className="section-title">Team Members</h2>
              <div className="team-list">
                <div className="team-card">
                  <h3 className="team-role">Business Owner</h3>
                  <p className="team-name">
                    {project.businessOwner?.fullname || 'Not assigned'}
                  </p>
                  <p className="team-email">
                    {project.businessOwner?.email || '-'}
                  </p>
                </div>
                <div className="team-card">
                  <h3 className="team-role">Business Manager</h3>
                  <p className="team-name">
                    {project.businessManager?.fullname || 'Not assigned'}
                  </p>
                  <p className="team-email">
                    {project.businessManager?.email || '-'}
                  </p>
                </div>
                <div className="team-card">
                  <h3 className="team-role">Accountants</h3>
                  {project.accountants?.length > 0 ? (
                    project.accountants.map((acc) => (
                      <div key={acc._id} className="team-subitem">
                        <p className="team-name">{acc.fullname}</p>
                        <p className="team-email">{acc.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
                <div className="team-card">
                  <h3 className="team-role">Financial Managers</h3>
                  {project.financialManagers?.length > 0 ? (
                    project.financialManagers.map((fm) => (
                      <div key={fm._id} className="team-subitem">
                        <p className="team-name">{fm.fullname}</p>
                        <p className="team-email">{fm.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;