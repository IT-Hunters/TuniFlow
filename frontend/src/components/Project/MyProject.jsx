import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './MyProject.css';

const API_URL = 'http://localhost:3000/users';
const API_Project = 'http://localhost:3000/project';

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
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMyProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in.');
      const response = await axios.get(`${API_Project}/my-project`, { // Fixed endpoint
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
    } catch (err) {
      console.error('Fetch Project Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in.');
      const [accountantResponse, financialManagerResponse, rhManagerResponse] = await Promise.all([
        axios.get(`${API_Project}/getAllAccountantsofproject`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_Project}/getAllFinancialManagersOfProject`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_Project}/getAllHRsOfProject`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      // Extrait les tableaux des réponses
      setAccountants(accountantResponse.data.accountants || []);
      setFinancialManagers(financialManagerResponse.data.financialManagers || []);
      setRhManagers(rhManagerResponse.data.rhManagers || []); // Supposons que la clé est "rhManagers"
    } catch (err) {
      console.error('Fetch Users Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch users: ' + err.message);
    }
  };
  const handleAssignUser = async (userId, userType) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in.');
      const endpoint = {
        'Accountant': `${API_Project}/assignAccountantToProject/${userId}`,
        'FinancialManager': `${API_Project}/assignFinancialManagerToProject/${userId}`,
        'RH': `${API_Project}/assignRHManagerToProject/${userId}`,
      }[userType];
      if (!endpoint) throw new Error('Invalid user type.');
      const response = await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      setAssignmentSuccess(response.data.message);
      await Promise.all([fetchMyProject(), fetchAvailableUsers()]);
    } catch (err) {
      console.error('Assignment Error:', err.response?.data || err.message);
      setAssignmentError(err.response?.data?.message || 'Failed to assign user: ' + err.message);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignUser = async (userId, userType) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in.');
      const endpoint = {
        'Accountant': `${API_Project}/unassignaccountant/${userId}`,
        'FinancialManager': `${API_Project}/unassignfinancialmanager/${userId}`,
        'RH': `${API_Project}/unassignrh/${userId}`,
      }[userType];
      if (!endpoint) throw new Error('Invalid user type.');
      const response = await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      setAssignmentSuccess(response.data.message);
      await Promise.all([fetchMyProject(), fetchAvailableUsers()]);
    } catch (err) {
      console.error('Unassignment Error:', err.response?.data || err.message);
      setAssignmentError(err.response?.data?.message || 'Failed to unassign user: ' + err.message);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProject();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchMyProject();
      fetchAvailableUsers();
    }
  }, [location.state]);

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>My Project</h1>
          <div className="MyProject-project-details card">
            <h2>Project Details</h2>
            {loading && <p>Loading project...</p>}
            {error && <div className="alert alert-error">{error}</div>}
            {!loading && !error && !project && <p>No project assigned to you.</p>}
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
          {!loading && !error && project && (
            <div className="MyProject-assignment-section card">
              <h2>Assign Users to Project</h2>
              <button
                className="btn btn-primary MyProject-add-user-btn"
                onClick={() => navigate('/AddUser')}
                disabled={assignmentLoading}
              >
                Add User
              </button>
              {assignmentError && <div className="alert alert-error">{assignmentError}</div>}
              {assignmentSuccess && <div className="alert alert-success">{assignmentSuccess}</div>}
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
                  {accountants.map((user) => (
                    <tr key={user._id}>
                      <td>Accountant</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="btn btn-danger MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'Accountant')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAssignUser(user._id, 'Accountant')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {financialManagers.map((user) => (
                    <tr key={user._id}>
                      <td>Financial Manager</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="btn btn-danger MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'FinancialManager')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAssignUser(user._id, 'FinancialManager')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rhManagers.map((user) => (
                    <tr key={user._id}>
                      <td>RH Manager</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        {user.project ? (
                          <button
                            className="btn btn-danger MyProject-unassign-btn"
                            onClick={() => handleUnassignUser(user._id, 'RH')}
                            disabled={assignmentLoading}
                          >
                            {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
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