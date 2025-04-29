import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate } from 'react-router-dom';
import './Objectifmanagement.css';

const API_Users = 'http://localhost:3000/users';
const API_Objectif = 'http://localhost:3000/objectif';

const ITEMS_PER_PAGE = 6; // Increased from 4 to 6 to display 6 cards per page

const ObjectivesList = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Added for success feedback
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProject();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      if (/^[0-9a-fA-F]{24}$/.test(selectedProject)) {
        fetchObjectives();
      } else {
        setError('Invalid project ID format. Please select a valid project.');
      }
    }
  }, [selectedProject]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchMyProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_Users}/findMyProject`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const projectData = Array.isArray(response.data) ? response.data : [response.data];
      console.log('Fetched projects:', projectData);
      if (!projectData.length) {
        setError('No projects found for this user.');
        return;
      }
      setProjects(projectData);
      if (projectData[0] && projectData[0].id && /^[0-9a-fA-F]{24}$/.test(projectData[0].id)) {
        setSelectedProject(projectData[0].id);
      } else {
        setError('Invalid project ID in fetched data. Please contact support.');
      }
    } catch (err) {
      console.error('Error fetching project:', err.response?.data || err.message);
      setError(`Failed to fetch project: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      console.log('Fetching objectives for projectId:', selectedProject);
      const response = await axios.get(`${API_Objectif}/getAllObjectifsByProjectId/${selectedProject}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Objectives response:', response.data);
      setObjectives(response.data.objectifs || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching objectives:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch objectives');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (objective) => {
    navigate('/ObjectifDetails', { state: { objective, selectedProject } });
  };

  const handleAddObjective = () => {
    navigate('/AddObjective', { state: { selectedProject } });
  };

  const handleDelete = async (objectifId) => {
    // Show a confirmation dialog before deleting
    const confirmDelete = window.confirm('Are you sure you want to delete this objective?');
    if (!confirmDelete) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.delete(`${API_Objectif}/deletobjectif/${objectifId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setSuccessMessage('Objective deleted successfully');
        // Remove the deleted objective from the state
        setObjectives((prev) => prev.filter((obj) => obj._id !== objectifId));
        // Reset pagination if necessary
        if (paginatedObjectives.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      } else {
        setError('Failed to delete objective');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting objective');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(objectives.length / ITEMS_PER_PAGE);
  const paginatedObjectives = objectives.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      if (startPage > 2) items.push("ellipsis-start");

      for (let i = startPage; i <= endPage; i++) {
        items.push(i);
      }

      if (endPage < totalPages - 1) items.push("ellipsis-end");

      if (totalPages > 1) items.push(totalPages);
    }

    return items;
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Objective Management</h1>

          {/* Project Selection */}
          <div className="project-selection">
            <h2>Select Project</h2>
            <select
              value={selectedProject}
              onChange={(e) => {
                console.log('Selected project ID:', e.target.value);
                setSelectedProject(e.target.value);
              }}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} (Owner: {project.businessOwner?.name || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          {/* Success, Error, and Loading States */}
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          {/* Objectives List and Add Button */}
          {selectedProject && !loading && !error && (
            <>
             

              {objectives.length > 0 ? (
                <div className="objectives-list">
                  <div className="objectives-header">
                    <h2>Objectives</h2>
                    <div className="add-objective-section">
                      <button
                        className="create-button"
                        onClick={handleAddObjective}
                        disabled={loading}
                      >
                        <span>
                          <svg
                            height="24"
                            width="24"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"></path>
                          </svg>
                          Create
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="objectives-grid">
                    
                    {paginatedObjectives.map(objective => (
                      <div key={objective._id} className="obj-card">
                        <div className="obj-container">
                          <div className="obj-type">
                            {objective.objectivetype}
                          </div>
                          
                          <h3 className="obj-title">{objective.name}</h3>
                          <p className="obj-description">{objective.description}</p>
                          
                          <div className="progress-section">
                            <div className="progress-label">
                              <span>Progress</span>
                              <span>{objective.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${objective.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="due-date">
                            <span>Due date:</span>
                            <span>{new Date(objective.datefin).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                          </div>

                          <div className="obj-actions">
                            <button
                              className="obj-btn obj-btn-view"
                              onClick={() => handleViewDetails(objective)}
                              disabled={loading}
                            >
                              View Details
                            </button>
                            <button
                              className="obj-btn obj-btn-delete"
                              onClick={() => handleDelete(objective._id)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className={`pagination-prev ${currentPage === 1 ? "disabled" : ""}`}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>

                      <div className="pagination-numbers">
                        {getPaginationItems().map((item) => {
                          if (item === "ellipsis-start" || item === "ellipsis-end") {
                            return (
                              <span key={item} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={item}
                              className={`pagination-number ${currentPage === item ? "active" : ""}`}
                              onClick={() => setCurrentPage(item)}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className={`pagination-next ${currentPage === totalPages ? "disabled" : ""}`}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-objectives">
                  <p>No objectives found for this project.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectivesList;