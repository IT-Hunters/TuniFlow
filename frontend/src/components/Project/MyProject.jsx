import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CoolSidebar from '../sidebarHome/newSidebar'; // Adjust path as needed
import Navbar from '../navbarHome/NavbarHome'; // Adjust path as needed
import './MyProject.css'; // Ensure this file exists

const API_URL = 'http://localhost:3000/users'; // Replace with your backend URL
const API_Project = 'http://localhost:3000/project'; // Replace with your backend URL

const MyProject = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountants, setAccountants] = useState([]);
  const [financialManagers, setFinancialManagers] = useState([]);
  const [rhManagers, setRhManagers] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    fullname: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '', // Changed to confirm to match backend validator
  });

  // Fetch the manager's project
  const fetchMyProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      const response = await axios.get(`${API_URL}/findMyProject`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
    } catch (err) {
      console.error('Fetch Project Error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        'Erreur lors de la récupération du projet: ' + err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch available accountants, financial managers, and RH managers
  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      const accountantResponse = await axios.get(`${API_URL}/getAllAccountants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccountants(accountantResponse.data);

      const financialManagerResponse = await axios.get(
        `${API_URL}/getAllFinancialManagers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFinancialManagers(financialManagerResponse.data);

      const rhManagerResponse = await axios.get(`${API_URL}/getAllRH`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRhManagers(rhManagerResponse.data);
    } catch (err) {
      console.error('Fetch Users Error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        'Erreur lors de la récupération des utilisateurs: ' + err.message
      );
    }
  };

  // Handle assignment of accountants, financial managers, and RH managers
  const handleAssignUser = async (userId, userType) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      let endpoint = '';
      switch (userType) {
        case 'Accountant':
          endpoint = `${API_Project}/assignAccountantToProject/${userId}`;
          break;
        case 'FinancialManager':
          endpoint = `${API_Project}/assignFinancialManagerToProject/${userId}`;
          break;
        case 'RH':
          endpoint = `${API_Project}/assignRHManagerToProject/${userId}`;
          break;
        default:
          throw new Error('Invalid user type.');
      }
      console.log('Assigning user:', { userId, userType, endpoint });
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignmentSuccess(response.data.message);
      await fetchMyProject();
      await fetchAvailableUsers();
    } catch (err) {
      console.error('Assignment Error:', err.response?.data || err.message);
      setAssignmentError(
        err.response?.data?.message ||
        'Erreur lors de l\'assignation: ' + err.message
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle unassignment of accountants, financial managers, and RH managers
  const handleUnassignUser = async (userId, userType) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      let endpoint = '';
      switch (userType) {
        case 'Accountant':
          endpoint = `${API_Project}/unassignaccountant/${userId}`;
          break;
        case 'FinancialManager':
          endpoint = `${API_Project}/unassignfinancialmanager/${userId}`;
          break;
        case 'RH':
          endpoint = `${API_Project}/unassignrh/${userId}`;
          break;
        default:
          throw new Error('Invalid user type.');
      }
      console.log('Unassigning user:', { userId, userType, endpoint });
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignmentSuccess(response.data.message);
      await fetchMyProject();
      await fetchAvailableUsers();
    } catch (err) {
      console.error('Unassignment Error:', err.response?.data || err.message);
      setAssignmentError(
        err.response?.data?.message ||
        'Erreur lors de la désassignation: ' + err.message
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle adding a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);

    // Check if passwords match
    if (formData.password !== formData.confirm) {
      setAssignmentError('Les mots de passe ne correspondent pas.');
      setAssignmentLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      const response = await axios.post(
        `${API_URL}/registerwithproject`,
        {
          role: formData.role,
          fullname: formData.fullname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          confirm: formData.confirm, // Include confirm in the payload
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssignmentSuccess(response.data.message);
      setShowAddUserForm(false); // Hide form on success
      setFormData({
        role: '',
        fullname: '',
        lastname: '',
        email: '',
        password: '',
        confirm: '', // Reset confirm field
      }); // Reset form
      await fetchMyProject();
      await fetchAvailableUsers();
    } catch (err) {
      console.error('Add User Error:', err.response?.data || err.message);
      setAssignmentError(
        err.response?.data?.message ||
        'Erreur lors de l\'ajout de l\'utilisateur: ' + err.message
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProject();
    fetchAvailableUsers();
  }, []);

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>My Project</h1>

          {/* Project Details Section */}
          <div className="MyProject-project-details">
            <h2>Project Details</h2>
            {loading && <p>Loading project...</p>}
            {error && <p className="MyProject-error">{error}</p>}
            {!loading && !error && !project && (
              <p>No project assigned to you.</p>
            )}
            {!loading && !error && project && (
              <div className="MyProject-project-info">
                <p><strong>Status:</strong> {project.status}</p>
                <p><strong>Due Date:</strong> {new Date(project.due_date).toLocaleDateString()}</p>
                <p><strong>Assigned Accountants:</strong> {project.accountants.length}</p>
                <p><strong>Assigned Financial Managers:</strong> {project.financialManagers.length}</p>
                <p><strong>Assigned RH Managers:</strong> {project.rhManagers.length}</p>
              </div>
            )}
          </div>

          {/* Assignment Table Section */}
          {!loading && !error && project && (
            <div className="MyProject-assignment-section">
              <h2>Assign Users to Project</h2>
              <button
                className="MyProject-add-user-btn"
                onClick={() => setShowAddUserForm(true)}
                disabled={assignmentLoading}
              >
                Add User
              </button>
              {assignmentError && <p className="MyProject-error">{assignmentError}</p>}
              {assignmentSuccess && <p className="MyProject-success">{assignmentSuccess}</p>}

              {/* Add User Form */}
              {showAddUserForm && (
                <form className="MyProject-add-user-form" onSubmit={handleAddUser}>
                  <div className="MyProject-form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="FINANCIAL_MANAGER">Financial Manager</option>
                      <option value="RH">RH Manager</option>
                    </select>
                  </div>
                  <div className="MyProject-form-group">
                    <label htmlFor="fullname">Full Name</label>
                    <input
                      type="text"
                      id="fullname"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="MyProject-form-group">
                    <label htmlFor="lastname">Last Name</label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="MyProject-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="MyProject-form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="MyProject-form-group">
                    <label htmlFor="confirm">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm"
                      name="confirm"
                      value={formData.confirm}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="MyProject-form-actions">
                    <button type="submit" disabled={assignmentLoading}>
                      {assignmentLoading ? 'Adding...' : 'Add User'}
                    </button>
                    <button
                      type="button"
                      className="MyProject-cancel-btn"
                      onClick={() => setShowAddUserForm(false)}
                      disabled={assignmentLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <table className="MyProject-assignment-table">
                <thead>
                  <tr>
                    <th>User Type</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Assigned Project</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Accountants */}
                  {accountants.map((user) => (
                    <tr key={user._id}>
                      <td>Accountant</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'Accountant')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignUser(user._id, 'Accountant')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Financial Managers */}
                  {financialManagers.map((user) => (
                    <tr key={user._id}>
                      <td>Financial Manager</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'FinancialManager')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignUser(user._id, 'FinancialManager')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* RH Managers */}
                  {rhManagers.map((user) => (
                    <tr key={user._id}>
                      <td>RH Manager</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'RH')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignUser(user._id, 'RH')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProject;