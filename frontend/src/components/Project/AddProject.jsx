import  { useState, useEffect } from 'react';
import axios from 'axios';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './AddProject.css';

const API_URL = 'http://localhost:3000/users'; // Replace with your backend URL
const API_Project = 'http://localhost:3000/project'; // Replace with your backend URL
const AddProject = () => {
  const [businessManagers, setBusinessManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(null);
  const [managerFormData, setManagerFormData] = useState({
    fullname: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
    role: 'BUSINESS_MANAGER',
  });
  const [projectFormData, setProjectFormData] = useState({
    amount: '',
    status: 'PENDING',
    due_date: '',
    accountants: [],
    financialManagers: [],
    rhManagers: [],
  });
  const [managerFormError, setManagerFormError] = useState(null);
  const [managerFormSuccess, setManagerFormSuccess] = useState(null);
  const [projectFormError, setProjectFormError] = useState(null);
  const [projectFormSuccess, setProjectFormSuccess] = useState(null);

  // Fetch Business Managers
  const fetchBusinessManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      const response = await axios.get(`${API_URL}/getAllBusinessManagers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBusinessManagers(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Erreur lors de la récupération des Business Managers'
      );
      console.error('Fetch Error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessManagers();
  }, []);

  // Handle Manager Form Input Changes
  const handleManagerInputChange = (e) => {
    const { name, value } = e.target;
    setManagerFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle Project Form Input Changes
  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    setProjectFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle Manager Form Submission (RegisterManger)
  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    setManagerFormError(null);
    setManagerFormSuccess(null);
    setManagerLoading(true);

    // Client-side validation
    if (
      !managerFormData.fullname ||
      !managerFormData.lastname ||
      !managerFormData.email ||
      !managerFormData.password ||
      !managerFormData.confirm
    ) {
      setManagerFormError('All fields are required.');
      setManagerLoading(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(managerFormData.email)) {
      setManagerFormError('Invalid email format.');
      setManagerLoading(false);
      return;
    }
    if (managerFormData.password.length < 8) {
      setManagerFormError('Password must be at least 8 characters.');
      setManagerLoading(false);
      return;
    }
    if (managerFormData.password !== managerFormData.confirm) {
      setManagerFormError('Passwords do not match.');
      setManagerLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      console.log('Registering Manager with data:', {
        fullname: managerFormData.fullname,
        lastname: managerFormData.lastname,
        email: managerFormData.email,
        password: managerFormData.password,
        confirm: managerFormData.confirm,
        role: managerFormData.role,
      });
      const response = await axios.post(`${API_URL}/registermanager`, {
        fullname: managerFormData.fullname,
        lastname: managerFormData.lastname,
        email: managerFormData.email,
        password: managerFormData.password,
        confirm: managerFormData.confirm,
        role: managerFormData.role,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setManagerFormSuccess(response.data.message);
      setManagerFormData({
        fullname: '',
        lastname: '',
        email: '',
        password: '',
        confirm: '',
        role: 'BUSINESS_MANAGER',
      });
      setShowManagerForm(false);
      fetchBusinessManagers();
    } catch (err) {
      console.error('Manager Registration Error:', err.response?.data || err.message);
      setManagerFormError(
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Erreur lors de l\'inscription du Business Manager: ' + err.message
      );
    } finally {
      setManagerLoading(false);
    }
  };

  // Handle Project Form Submission (addProject)
  const handleProjectSubmit = async (businessManagerId) => {
    setProjectFormError(null);
    setProjectFormSuccess(null);
    setProjectLoading(true);

    // Client-side validation
    if (!projectFormData.amount || !projectFormData.due_date || !projectFormData.status) {
      setProjectFormError('Amount, Status, and Due Date are required.');
      setProjectLoading(false);
      return;
    }
    if (isNaN(projectFormData.amount) || projectFormData.amount <= 0) {
      setProjectFormError('Amount must be a positive number.');
      setProjectLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      console.log('Assigning Project with data:', { businessManagerId, ...projectFormData });
      const response = await axios.post(
        `${API_Project}/addproject/${businessManagerId}`,
        projectFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjectFormSuccess(response.data.message);
      setProjectFormData({
        amount: '',
        status: 'PENDING',
        due_date: '',
        accountants: [],
        financialManagers: [],
        rhManagers: [],
      });
      setShowProjectForm(null);
      fetchBusinessManagers();
    } catch (err) {
      console.error('Project Assignment Error:', err.response?.data || err.message);
      setProjectFormError(
        err.response?.data?.message ||
        err.response?.statusText ||
        'Erreur lors de la création du projet: ' + err.message
      );
    } finally {
      setProjectLoading(false);
    }
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Add New Project</h1>
          <div className="business-managers">
            <h2>Business Managers</h2>
            <div className="button-group">
              <button
                onClick={() => setShowManagerForm(!showManagerForm)}
                className="add-button"
                disabled={managerLoading}
              >
                {managerLoading ? 'Loading...' : showManagerForm ? 'Cancel' : 'Add New Manager'}
              </button>
              <button
                onClick={fetchBusinessManagers}
                disabled={loading}
                className="refresh-button"
              >
                {loading ? 'Refreshing...' : 'Refresh List'}
              </button>
            </div>

            {/* Form for Adding a New Business Manager */}
            {showManagerForm && (
              <div className="manager-form">
                <h3>Add New Business Manager</h3>
                {managerFormError && <p className="error">{managerFormError}</p>}
                {managerFormSuccess && <p className="success">{managerFormSuccess}</p>}
                <form onSubmit={handleManagerSubmit}>
                  <div className="form-group">
                    <label htmlFor="fullname">First Name:</label>
                    <input
                      type="text"
                      id="fullname"
                      name="fullname"
                      value={managerFormData.fullname}
                      onChange={handleManagerInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastname">Last Name:</label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={managerFormData.lastname}
                      onChange={handleManagerInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={managerFormData.email}
                      onChange={handleManagerInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={managerFormData.password}
                      onChange={handleManagerInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm">Confirm Password:</label>
                    <input
                      type="password"
                      id="confirm"
                      name="confirm"
                      value={managerFormData.confirm}
                      onChange={handleManagerInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                      id="role"
                      name="role"
                      value={managerFormData.role}
                      onChange={handleManagerInputChange}
                      required
                    >
                      <option value="BUSINESS_MANAGER">Business Manager</option>
                    </select>
                  </div>
                  <button type="submit" className="submit-button" disabled={managerLoading}>
                    {managerLoading ? 'Registering...' : 'Register Manager'}
                  </button>
                </form>
              </div>
            )}

            {/* List of Business Managers */}
            {error && <p className="error">{error}</p>}
            {loading && !error && <p>Loading...</p>}
            {!loading && !error && businessManagers.length === 0 && (
              <p>Aucun Business Manager trouvé</p>
            )}
            {!loading && !error && businessManagers.length > 0 && (
              <ul className="manager-list">
                {businessManagers.map((manager) => (
                  <li key={manager._id} className="manager-item">
                    <div className="manager-info">
                      <span className="manager-name">
                        {manager.fullname} {manager.lastname}
                      </span>
                      <span className="manager-email">{manager.email}</span>
                      {manager.project && (
                        <span className="manager-assigned">
                          (Assigned to Project: {manager.project})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowProjectForm(manager._id)}
                      disabled={manager.project || projectLoading}
                      className="assign-button"
                    >
                      {projectLoading ? 'Assigning...' : 'Assign Project'}
                    </button>

                    {/* Project Form for This Manager */}
                    {showProjectForm === manager._id && (
                      <div className="project-form">
                        <h3>Create Project for {manager.fullname} {manager.lastname}</h3>
                        {projectFormError && <p className="error">{projectFormError}</p>}
                        {projectFormSuccess && <p className="success">{projectFormSuccess}</p>}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleProjectSubmit(manager._id);
                          }}
                        >
                          <div className="form-group">
                            <label htmlFor="amount">Amount:</label>
                            <input
                              type="number"
                              id="amount"
                              name="amount"
                              value={projectFormData.amount}
                              onChange={handleProjectInputChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="status">Status:</label>
                            <select
                              id="status"
                              name="status"
                              value={projectFormData.status}
                              onChange={handleProjectInputChange}
                              required
                            >
                              <option value="PENDING">Pending</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="due_date">Due Date:</label>
                            <input
                              type="date"
                              id="due_date"
                              name="due_date"
                              value={projectFormData.due_date}
                              onChange={handleProjectInputChange}
                              required
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              type="submit"
                              className="submit-button"
                              disabled={projectLoading}
                            >
                              {projectLoading ? 'Creating...' : 'Create and Assign'}
                            </button>
                            <button
                              onClick={() => setShowProjectForm(null)}
                              className="cancel-button"
                              disabled={projectLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProject;