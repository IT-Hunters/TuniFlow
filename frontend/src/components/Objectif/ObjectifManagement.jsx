import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate } from 'react-router-dom';
import './Objectifmanagement.css';

const API_Users = 'http://localhost:3000/users';
const API_Objectif = 'http://localhost:3000/objectif';

const ObjectivesList = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(''); // Initially empty
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProject();
  }, []);

  useEffect(() => {
    // Only fetch objectives if selectedProject is a non-empty string and a valid ObjectId
    if (selectedProject) {
      if (/^[0-9a-fA-F]{24}$/.test(selectedProject)) {
        fetchObjectives();
      } else {
        setError('Invalid project ID format. Please select a valid project.');
      }
    }
  }, [selectedProject]);

  const fetchMyProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_Users}/findMyProject`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const projectData = Array.isArray(response.data) ? response.data : [response.data];
      console.log('Fetched projects:', projectData); // Debug log
      if (!projectData.length) {
        setError('No projects found for this user.');
        return;
      }
      setProjects(projectData);
      // Use project.id instead of project._id
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
      console.log('Fetching objectives for projectId:', selectedProject); // Debug log
      const response = await axios.get(`${API_Objectif}/getAllObjectifsByProjectId/${selectedProject}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Objectives response:', response.data); // Debug log
      setObjectives(response.data.objectifs || []);
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
                console.log('Selected project ID:', e.target.value); // Debug log
                setSelectedProject(e.target.value);
              }}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}> {/* Use project.id instead of project._id */}
                  {project.name} (Owner: {project.businessOwner?.name || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          {/* Error and Loading States */}
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          {/* Objectives List and Add Button */}
          {selectedProject && !loading && !error && (
            <>
              {objectives.length > 0 ? (
                <div className="objectives-list">
                  <h2>Objectives</h2>
                  <div className="objectives-grid">
                    {objectives.map(objective => (
                      <div key={objective._id} className="objectif-card">
                        <div className="objectif-bookmark">
                          {objective.objectivetype}
                        </div>
                        <div className="objectif-card-details">
                          <p className="objectif-text-title">{objective.name}</p>
                          <p className="objectif-description">{objective.description}</p>
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
                        </div>
                        <button 
                          className="objectif-card-button objective-button"
                          onClick={() => handleViewDetails(objective)}
                          disabled={loading}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-objectives">
                  <p>No objectives found for this project.</p>
                </div>
              )}
              <div className="add-objective-section">
                <button 
                  className="add-objective-btn objective-button add-objective-button"
                  onClick={handleAddObjective}
                  disabled={loading}
                >
                  Add Objective
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectivesList;