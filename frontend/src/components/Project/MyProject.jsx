import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './MyProject.css';
import { Edit, Trash2 } from 'react-feather';

const API_URL = 'http://localhost:3000/users';
const API_Project = 'http://localhost:3000/project';
const API_Conversation = 'http://localhost:5000/project-conversations';

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
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState(null);
  const [conversationSuccess, setConversationSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMyProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in.');
      const response = await axios.get(`${API_Project}/my-project`, {
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

      setAccountants(accountantResponse.data.accountants || []);
      setFinancialManagers(financialManagerResponse.data.financialManagers || []);
      setRhManagers(rhManagerResponse.data.rhManagers || []);
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
        Accountant: `${API_Project}/assignAccountantToProject/${userId}`,
        FinancialManager: `${API_Project}/assignFinancialManagerToProject/${userId}`,
        RH: `${API_Project}/assignRHManagerToProject/${userId}`,
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
  
      // Choisir l'URL correcte selon le type d'utilisateur
      const endpoint = {
        Accountant: `${API_Project}/unassignaccountant/${userId}`,
        FinancialManager: `${API_Project}/unassignfinancialmanager/${userId}`,
        RH: `${API_Project}/unassignrh/${userId}`,
      }[userType];
  
      if (!endpoint) throw new Error('Type d’utilisateur invalide.');
  
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setAssignmentSuccess(response.data.message || 'Utilisateur désassigné avec succès.');
      await Promise.all([fetchMyProject(), fetchAvailableUsers()]);
    } catch (err) {
      console.error('Erreur lors du désassignement :', err.response?.data || err.message);
      setAssignmentError(err.response?.data?.message || 'Erreur lors du désassignement : ' + err.message);
    } finally {
      setAssignmentLoading(false);
    }
  };
  

  const handleEditUser = (userId) => {
    navigate(`/Updatebymanager/${userId}`);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/deletbyid/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await Promise.all([fetchMyProject(), fetchAvailableUsers()]);
        setAssignmentSuccess('User deleted successfully');
      } catch (err) {
        setAssignmentError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleAddConversation = async () => {
    setConversationLoading(true);
    setConversationError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      if (!project) throw new Error('No project found');
  
      // Récupération des utilisateurs assignés
      const response = await axios.get(
        `http://localhost:3000/project/${project._id}/assigned-users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const participants = response.data.map(user => user._id);
      const validRoles = ['ACCOUNTANT', 'FINANCIAL_MANAGER', 'RH', 'BUSINESS_MANAGER'];
      const invalidParticipants = response.data.filter(
        user => !validRoles.includes(user.role)
      );
  
      if (invalidParticipants.length > 0) {
        throw new Error('Some users have invalid roles');
      }
  
      // Création de la conversation
      await axios.post(
        API_Conversation,
        { projectId: project._id, participants },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      navigate('/conversation');
      
    } catch (err) {
      setConversationError(
        err.response?.data?.message || 
        'Failed to create conversation: ' + err.message
      );
    } finally {
      setConversationLoading(false);
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

  const allUsers = [
    ...accountants.map((user) => ({ ...user, userType: 'Accountant' })),
    ...financialManagers.map((user) => ({ ...user, userType: 'FinancialManager' })),
    ...rhManagers.map((user) => ({ ...user, userType: 'RH' })),
  ];

  // Vérifier si des participants sont assignés
  const hasParticipants =
    project &&
    (project.accountants.length > 0 ||
      project.financialManagers.length > 0 ||
      project.rhManagers.length > 0);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = allUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(allUsers.length / usersPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
                {hasParticipants ? (
                  <button
                    className="btn btn-primary MyProject-add-conversation-btn"
                    onClick={handleAddConversation}
                    disabled={conversationLoading || !project}
                  >
                    {conversationLoading ? 'Creating Conversation...' : 'Add Conversation'}
                  </button>
                ) : (
                  <p className="alert alert-warning">
                    No users assigned to this project. Please assign users below to start a conversation.
                  </p>
                )}
                {conversationError && <div className="alert alert-error">{conversationError}</div>}
                {conversationSuccess && <div className="alert alert-success">{conversationSuccess}</div>}
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.userType}</td>
                      <td>{user.fullname} {user.lastname}</td>
                      <td>{user.email}</td>
                      <td>{user.project ? 'Assigned' : 'Not Assigned'}</td>
                      <td>
                        <div className="MyProject-action-buttons">
                          {user.project ? (
                            <button
                              className="btn btn-danger MyProject-unassign-btn"
                              onClick={() => handleUnassignUser(user._id, user.userType)}
                              disabled={assignmentLoading}
                            >
                              {assignmentLoading ? 'Unassigning...' : 'Unassign'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleAssignUser(user._id, user.userType)}
                              disabled={assignmentLoading}
                            >
                              {assignmentLoading ? 'Assigning...' : 'Assign'}
                            </button>
                          )}
                          <Edit
                            size={16}
                            className="MyProject-edit-icon"
                            onClick={() => handleEditUser(user._id)}
                          />
                          <Trash2
                            size={16}
                            className="MyProject-delete-icon"
                            onClick={() => handleDeleteUser(user._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="MyProject-pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span style={{ margin: '0 10px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProject;
