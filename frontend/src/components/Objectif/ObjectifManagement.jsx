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
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProject();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchObjectives();
    }
  }, [selectedProject]);

  const fetchMyProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_Users}/findMyProject`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from findMyProject API');
      }
      setProjects([response.data]);
      setSelectedProject(response.data._id);
    } catch (err) {
      setError('Failed to fetch project. Check if the backend is running at http://localhost:3000');
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_Objectif}/getAllObjectifsByProjectId/${selectedProject}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setObjectives(response.data.objectifs || []);
    } catch (err) {
      setError('Failed to fetch objectives');
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
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
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
              {objectives.length > 0 && (
                <div className="objectives-list">
                  <h2>Objectives</h2>
                  <div className="objectives-grid">
                    {objectives.map(objective => (
                      <div key={objective._id} className="objectif-card">
                        {/* Bookmark for Objective Type */}
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