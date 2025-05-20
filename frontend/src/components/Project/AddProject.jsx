import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from '@/axios'
import { useNavigate, useLocation } from 'react-router-dom';
import './AddProject.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = '/users';
const API_PROJECT = '/project';

const CreateProject = () => {
  const [availableManagers, setAvailableManagers] = useState([]);
  const [formData, setFormData] = useState({
    managerId: '',
    amount: '',
    status: 'PENDING',
    due_date: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const preselectedManagerId = query.get('managerId');

    const fetchAvailableManagers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token is missing. Please log in.');
          return;
        }
        const response = await axios.get(`${API_URL}/getAllBusinessManagers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allManagers = response.data;
        const availableManagers = allManagers.filter((manager) => !manager.project);
        setAvailableManagers(availableManagers);

        if (preselectedManagerId) {
          if (availableManagers.some((m) => m._id === preselectedManagerId)) {
            setFormData((prev) => ({ ...prev, managerId: preselectedManagerId }));
          } else {
            setError('The selected manager is no longer available.');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch managers');
      }
    };

    fetchAvailableManagers();
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Specific frontend validations with custom alerts
    if (!formData.managerId) {
      setError('Please select a manager.');
      setLoading(false);
      return;
    }
    if (!formData.amount) {
      setError('Amount is required.');
      setLoading(false);
      return;
    }
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Amount must be a positive number greater than zero.');
      setLoading(false);
      return;
    }
    if (!formData.status) {
      setError('Please select a status.');
      setLoading(false);
      return;
    }
    if (!formData.due_date) {
      setError('Please select a due date.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing. Please log in.');
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_PROJECT}/addproject/${formData.managerId}`,
        {
          amount: formData.amount, // Send as string, backend can parse if needed
          status: formData.status,
          due_date: formData.due_date,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message || 'Project created successfully!');
      setTimeout(() => navigate('/ManagerList'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Create New Project</h1>
          <div className="form-container">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="managerId">Select Manager:</label>
                <select
                  id="managerId"
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  disabled={loading || availableManagers.length === 0}
                >
                  <option value="">Select a manager</option>
                  {availableManagers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.fullname} {manager.lastname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount:</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
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
                  value={formData.due_date}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create and Assign'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/ManagerList')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;