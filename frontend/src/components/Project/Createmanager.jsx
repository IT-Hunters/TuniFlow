import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddProject.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/users';

const CreateManager = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
    role: 'BUSINESS_MANAGER',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname) {
      newErrors.fullname = 'First name is required.';
    }
    if (!formData.lastname) {
      newErrors.lastname = 'Last name is required.';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }
    if (!formData.confirm) {
      newErrors.confirm = 'Please confirm your password.';
    } else if (formData.password !== formData.confirm) {
      newErrors.confirm = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);
    setLoading(true);

    // Validate all fields and set errors simultaneously
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors({ general: 'Authentication token is missing. Please log in.' });
        setLoading(false);
        return;
      }

      // Include 'confirm' in the request to match backend expectations
      const registerData = {
        fullname: formData.fullname,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        confirm: formData.confirm, // Added to satisfy validateRegister
        role: formData.role,
      };

      const response = await axios.post(`${API_URL}/register`, registerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(response.data.message || 'Manager registered successfully!');
      setTimeout(() => navigate('/ManagerList'), 2000);
    } catch (err) {
      console.error('Backend Error Response:', err.response?.data); // Log the exact error
      if (err.response && err.response.status === 400) {
        setErrors(err.response.data); // Expecting { email: "...", confirm: "..." }
      } else if (err.response && err.response.status === 409) {
        setErrors({ email: err.response.data.email }); // "User already exists"
      } else {
        setErrors({ general: err.response?.data?.message || 'Failed to register manager. Please try again.' });
      }
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
          <h1>Create New Manager</h1>
          <div className="form-container">
            {success && <div className="alert alert-success">{success}</div>}
            {errors.general && <div className="alert alert-error">{errors.general}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullname">First Name:</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter first name"
                />
                {errors.fullname && <span className="field-error">{errors.fullname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastname">Last Name:</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter last name"
                />
                {errors.lastname && <span className="field-error">{errors.lastname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter password"
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password:</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Confirm password"
                />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Manager'}
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

export default CreateManager;