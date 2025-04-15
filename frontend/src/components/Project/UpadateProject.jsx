import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './UpdateProject.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/project/getbyid';
const UPDATE_PROJECT_URL = 'http://localhost:3000/project/updateproject';

const UpdateProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    due_date: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Fetch project details on mount
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const projectData = response.data;
        setProject(projectData);
        // Prefill form with existing project data
        setFormData({
          status: projectData.status || '',
          due_date: projectData.due_date
            ? new Date(projectData.due_date).toISOString().split('T')[0]
            : '',
        });
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err.response?.data?.message || 'Failed to load project details');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${UPDATE_PROJECT_URL}/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Redirect to project details with success message
      navigate(`/projects/${id}`, {
        state: { message: 'Project updated successfully' },
      });
    } catch (err) {
      console.error('Error updating project:', err);
      setFormError(
        err.response?.data?.message || 'Failed to update project'
      );
    }
  };

  if (loading) {
    return (
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container error">
        <h3>Oops, Something Went Wrong</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="action-btn retry-btn"
        >
          Retry
        </button>
        <Link to="/OwnerProjectsView" className="back-link">
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="state-container not-found">
        <h3>Project Not Found</h3>
        <p>The requested project could not be found.</p>
        <Link to="/OwnerProjectsView" className="back-link">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="update-project-wrapper">
          <Link to={`/projects/${id}`} className="back-link">
            ← Back to Project Details
          </Link>
          <header className="project-header">
            <h1 className="project-title">Edit Project</h1>
          </header>

          <section className="update-form">
            <div className="detail-card">
              <h2 className="card-title">Update Project Details</h2>
              {formError && (
                <div className="error-message">{formError}</div>
              )}
              <form onSubmit={handleSubmit} className="project-form">
                <div className="form-group">
                  <label htmlFor="status" className="label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="due_date" className="label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="action-btn submit-btn"
                  >
                    Save Changes
                  </button>
                  <Link
                    to={`/projects/${id}`}
                    className="action-btn cancel-btn"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UpdateProject;