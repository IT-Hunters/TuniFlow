import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './OwnerProjectsView.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000'; // Replace with your backend URL
const PROJECTS_PER_PAGE = 6; // 6 projects = 2 rows of 3 cards

const OwnerProjectsView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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
          headers: { Authorization: `Bearer ${token}` },
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

  // Pagination logic
  const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const paginatedProjects = projects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
  };


  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      // Appel à l'API backend pour générer un rapport PDF
      const response = await axios.get(`${API_URL}/project/generatereportowner`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Pour récupérer le fichier PDF sous forme de blob
      });
  
      // Créer un lien pour télécharger le PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'projects_report.pdf'); // Nom du fichier PDF
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate the report');
    }
  };
  

  if (loading) {
    return (
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Loading your projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container error">
        <h3>Oops, Something Went Wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="action-btn error-btn">
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="state-container empty">
        <h3>No Projects Yet</h3>
        <p>Start by creating your first project!</p>
        <button onClick={() => navigate('/create-project')} className="action-btn create-btn">
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="projects-wrapper">
          <header className="projects-header">
            <h1>My Projects</h1>
            <button
  onClick={handleGenerateReport}
  className="generate-report-btn"
>
  <span className="btn-icon">📊</span>
  <span className="btn-text">Générer un rapport</span>
</button>

            <p>Manage and track your ongoing projects</p>
          </header>
          <div className="projects-grid">
            {paginatedProjects.map((project) => (
              <div key={project._id} className="project-card">
                <h2 className="project-title">
                  {project.name || `Project ${project._id.toString().slice(-4)}`}
                </h2>
                <div className="project-info">
                  <div className="info-item">
                    <span className="label">Status</span>
                    <span className={`status ${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Budget</span>
                    <span>
                      {project.amount ? `$${project.amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Start Date</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">End Date</span>
                    <span>
                      {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Ongoing'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="details-btn"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProjectsView;