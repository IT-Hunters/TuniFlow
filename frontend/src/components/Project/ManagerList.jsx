import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { UserPlus, RefreshCw, FolderPlus, Users, UserCheck, Edit, Trash2 } from 'react-feather';
import './AddProject.css';

const API_URL = 'http://localhost:3000/users';

const ManagerList = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const managersPerPage = 6;
  const navigate = useNavigate();

  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/getBusinessManagersByOwner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setManagers(response.data.businessManagers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch managers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditManager = (managerId) => {
    navigate(`/edit-manager/${managerId}`);
  };

  const handleDeleteManager = async (managerId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce manager ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/deletbyid/${managerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Rafraîchir la liste après suppression
        fetchManagers();
        // Afficher un message de succès
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Échec de la suppression du manager');
      }
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Calculate total pages and slice managers for the current page
  const totalPages = Math.ceil(managers.length / managersPerPage);
  const indexOfLastManager = currentPage * managersPerPage;
  const indexOfFirstManager = indexOfLastManager - managersPerPage;
  const currentManagers = managers.slice(indexOfFirstManager, indexOfLastManager);

  // Handle page changes
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Business Managers</h1>
          <div className="button-group">
            <button className="btn btn-primary" onClick={() => navigate('/Createmanager')}>
              <UserPlus size={16} />
              Add New Manager
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/AddProject')}>
              <FolderPlus size={16} />
              Create Project
            </button>
            <button className="btn btn-secondary" onClick={fetchManagers} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} />
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              Loading managers...
            </div>
          ) : managers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users />
              </div>
              <p>No Business Managers found</p>
              <button className="btn btn-primary" onClick={() => navigate('/Createmanager')}>
                <UserPlus size={16} />
                Add Your First Manager
              </button>
            </div>
          ) : (
            <>
              <div className="manager-list">
                {currentManagers.map((manager) => (
                  <div key={manager._id} className="manager-card">
                    <div className="manager-info">
                      <span className="manager-name">
                        {manager.fullname} {manager.lastname}
                      </span>
                      <span className="manager-email">{manager.email}</span>
                      {manager.status === 'assigned' && (
                        <span className="manager-status">
                          <UserCheck size={14} />
                          Assigned to project
                        </span>
                      )}
                    </div>
                    <div className="managerrr-actions">
                      <div className="actionnn-icons">
                        <Edit 
                          size={18} 
                          className="edittt-icon" 
                          onClick={() => navigate(`/edit-manager/${manager._id}`)} 
                        />
                        <Trash2 
                          size={18} 
                          className="deleteee-icon" 
                          onClick={() => handleDeleteManager(manager._id)} 
                        />
                      </div>
                      {manager.status === 'unassigned' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/AddProject?managerId=${manager._id}`)}
                        >
                          <FolderPlus size={16} />
                          Assign Project
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary pagination-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`btn pagination-btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn btn-secondary pagination-btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerList;