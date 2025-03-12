import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './Objectifmanagement.css';

// Utility function to format date to YYYY-MM-DD
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
};

const API_Users = 'http://localhost:3000/users';
const API_Objectif = 'http://localhost:3000/objectif';

const ObjectifManagement = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [newObjective, setNewObjective] = useState({
    name: '',
    description: '',
    target_amount: '',
    minbudget: '',
    maxbudget: '',
    datedebut: '',
    datefin: '',
    objectivetype: 'BUDGET',
    isStatic: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editObjective, setEditObjective] = useState(null); // State to track the objective being edited

  useEffect(() => {
    console.log('Component mounted');
    fetchMyProject();
  }, []);

  useEffect(() => {
    console.log('Selected project changed:', selectedProject);
    if (selectedProject) {
      fetchObjectives();
    }
  }, [selectedProject]);

  const fetchMyProject = async () => {
    try {
      setLoading(true);
      console.log('Fetching my project...');
      const response = await axios.get(`${API_Users}/findMyProject`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from findMyProject API');
      }
      console.log('Project response:', response.data);
      setProjects([response.data]);
      setSelectedProject(response.data._id);
    } catch (err) {
      console.error('Project fetch error:', err.message);
      setError('Failed to fetch project. Check if the backend is running at http://localhost:3000');
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectives = async () => {
    try {
      setLoading(true);
      console.log('Fetching objectives for project:', selectedProject);
      const response = await axios.get(`${API_Objectif}/getAllObjectifsByProjectId/${selectedProject}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Objectives response:', response.data);
      setObjectives(response.data.objectifs || []);
    } catch (err) {
      console.error('Objectives fetch error:', err);
      setError('Failed to fetch objectives');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const objectiveData = {
        ...newObjective,
        project: selectedProject
      };
      await axios.post(`${API_Objectif}/createobjectifs`, objectiveData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNewObjective({
        name: '',
        description: '',
        target_amount: '',
        minbudget: '',
        maxbudget: '',
        datedebut: '',
        datefin: '',
        objectivetype: 'BUDGET',
        isStatic: false
      });
      setShowCreateForm(false);
      fetchObjectives();
    } catch (err) {
      setError('Failed to create objective');
    } finally {
      setLoading(false);
    }
  };

  const handleEditObjective = (objective) => {
    // Format dates to YYYY-MM-DD before setting editObjective
    setEditObjective({
      ...objective,
      datedebut: formatDate(objective.datedebut),
      datefin: formatDate(objective.datefin)
    });
    setShowCreateForm(false); // Ensure create form is hidden
  };

  const handleUpdateObjective = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API_Objectif}/updateobjectif/${editObjective._id}`, editObjective, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEditObjective(null); // Clear the edit state
      fetchObjectives(); // Refresh the objectives list
    } catch (err) {
      setError('Failed to update objective');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEdit = (e) => {
    const { name, value, type, checked } = e.target;
    setEditObjective(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProgressChange = (e) => {
    const value = e.target.value;
    setEditObjective(prev => ({
      ...prev,
      progress: value
    }));
    // Update the displayed value
    const sliderValue = document.querySelector('.PB-range-slidervalue');
    if (sliderValue) {
      sliderValue.textContent = `${value}%`;
    }
  };

  console.log('Current state:', { 
    loading, 
    error, 
    selectedProject, 
    projects: projects.length, 
    objectives: objectives.length 
  });

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
                      <div key={objective._id} className="objective-card">
                        <h3>{objective.name}</h3>
                        <p>{objective.description}</p>
                        <p>Target Amount: ${objective.target_amount}</p>
                        <p>Budget Range: ${objective.minbudget} - ${objective.maxbudget}</p>
                        <p>Start Date: {new Date(objective.datedebut).toLocaleDateString()}</p>
                        <p>End Date: {new Date(objective.datefin).toLocaleDateString()}</p>
                        <p>Type: {objective.objectivetype}</p>
                        <p>Status: {objective.status}</p>
                        <p>Progress: {objective.progress}%</p>
                        <p>Static: {objective.isStatic ? 'Yes' : 'No'}</p>
                        <button 
                          className="edit-objective-btn"
                          onClick={() => handleEditObjective(objective)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="add-objective-section">
                <button 
                  className="add-objective-btn"
                  onClick={() => setShowCreateForm(true)}
                  disabled={loading}
                >
                  Add Objective
                </button>
              </div>

              {showCreateForm && (
                <div className="create-objective-section">
                  <h2>Create New Objective</h2>
                  <form onSubmit={handleCreateObjective}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newObjective.name}
                      onChange={(e) => setNewObjective({ ...newObjective, name: e.target.value })}
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={newObjective.description}
                      onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Target Amount"
                      value={newObjective.target_amount}
                      onChange={(e) => setNewObjective({ ...newObjective, target_amount: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Minimum Budget"
                      value={newObjective.minbudget}
                      onChange={(e) => setNewObjective({ ...newObjective, minbudget: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Maximum Budget"
                      value={newObjective.maxbudget}
                      onChange={(e) => setNewObjective({ ...newObjective, maxbudget: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      value={newObjective.datedebut}
                      onChange={(e) => setNewObjective({ ...newObjective, datedebut: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      value={newObjective.datefin}
                      onChange={(e) => setNewObjective({ ...newObjective, datefin: e.target.value })}
                      required
                    />
                    <select
                      value={newObjective.objectivetype}
                      onChange={(e) => setNewObjective({ ...newObjective, objectivetype: e.target.value })}
                    >
                      <option value="BUDGET">Budget</option>
                      <option value="COST_REDUCTION">Cost Reduction</option>
                      <option value="REVENUE_GROWTH">Revenue Growth</option>
                      <option value="PROFIT_MARGIN">Profit Margin</option>
                      <option value="CASH_FLOW">Cash Flow</option>
                      <option value="INVESTMENT">Investment</option>
                      <option value="DEBT_MANAGEMENT">Debt Management</option>
                      <option value="EXPENSE_CONTROL">Expense Control</option>
                      <option value="TAX_OPTIMIZATION">Tax Optimization</option>
                    </select>
                    <label>
                      Static Objective:
                      <input
                        type="checkbox"
                        checked={newObjective.isStatic}
                        onChange={(e) => setNewObjective({ ...newObjective, isStatic: e.target.checked })}
                      />
                    </label>
                    <button type="submit" disabled={loading}>
                      Create Objective
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {editObjective && (
                <div className="create-objective-section">
                  <h2>Edit Objective</h2>
                  <form onSubmit={handleUpdateObjective}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={editObjective.name}
                      onChange={handleChangeEdit}
                      required
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={editObjective.description}
                      onChange={handleChangeEdit}
                      required
                    />
                    <input
                      type="number"
                      name="target_amount"
                      placeholder="Target Amount"
                      value={editObjective.target_amount}
                      onChange={handleChangeEdit}
                      required
                    />
                    <input
                      type="number"
                      name="minbudget"
                      placeholder="Minimum Budget"
                      value={editObjective.minbudget}
                      onChange={handleChangeEdit}
                      required
                    />
                    <input
                      type="number"
                      name="maxbudget"
                      placeholder="Maximum Budget"
                      value={editObjective.maxbudget}
                      onChange={handleChangeEdit}
                      required
                    />
                    <input
                      type="date"
                      name="datedebut"
                      value={editObjective.datedebut}
                      onChange={handleChangeEdit}
                      required
                    />
                    <input
                      type="date"
                      name="datefin"
                      value={editObjective.datefin}
                      onChange={handleChangeEdit}
                      required
                    />
                    <select
                      name="objectivetype"
                      value={editObjective.objectivetype}
                      onChange={handleChangeEdit}
                    >
                      <option value="BUDGET">Budget</option>
                      <option value="COST_REDUCTION">Cost Reduction</option>
                      <option value="REVENUE_GROWTH">Revenue Growth</option>
                      <option value="PROFIT_MARGIN">Profit Margin</option>
                      <option value="CASH_FLOW">Cash Flow</option>
                      <option value="INVESTMENT">Investment</option>
                      <option value="DEBT_MANAGEMENT">Debt Management</option>
                      <option value="EXPENSE_CONTROL">Expense Control</option>
                      <option value="TAX_OPTIMIZATION">Tax Optimization</option>
                    </select>
                    <label>
                      Static Objective:
                      <input
                        type="checkbox"
                        name="isStatic"
                        checked={editObjective.isStatic}
                        onChange={handleChangeEdit}
                      />
                    </label>
                    <div className="PB-range-slider-div">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editObjective.progress || 0}
                        className="PB-range-slider"
                        id="myRange"
                        onChange={handleProgressChange}
                      />
                      <p className="PB-range-slidervalue">{editObjective.progress || 0}%</p>
                    </div>
                    <button type="submit" disabled={loading}>
                      Update Objective
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditObjective(null)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectifManagement;