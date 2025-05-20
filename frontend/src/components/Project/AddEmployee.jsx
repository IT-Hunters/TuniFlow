import React, { useState } from 'react';
//import axios from 'axios';
import axios from '@/axios'
import { useNavigate } from 'react-router-dom';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './AddEmployee.css';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateFields = () => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Invalid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase, one lowercase and one number';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        '/users/addemployee',
        {
          ...formData,
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'employee' 
      });

      setTimeout(() => navigate('/projectview'), 2000);
    } catch (err) {
      let errorMessage = "An error occurred while adding the employee";
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data.message || 'Validation error';
            // Handle field-specific errors from backend
            if (err.response.data.fields) {
              setFieldErrors(err.response.data.fields);
            }
            break;
          case 401:
            errorMessage = 'Session expired. Please login again';
            setTimeout(() => navigate('/login'), 2000);
            break;
          case 403:
            errorMessage = 'You are not authorized to perform this action';
            break;
          case 409:
            errorMessage = 'An employee with this email already exists';
            setFieldErrors({ email: errorMessage });
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="update-project-wrapper">
          <header className="project-header">
            <h1 className="project-title">Add New Employee</h1>
          </header>

          <section className="update-form">
            <div className="detail-card">
              <h2 className="card-title">Employee Details</h2>

              {success && (
                <div className="alert alert-success">
                  Employee added successfully. Redirecting...
                </div>
              )}

              {error && !Object.keys(fieldErrors).length && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="project-form" noValidate>
                <div className="form-group">
                  <label htmlFor="name" className="label">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                    required
                  />
                  {fieldErrors.name && (
                    <span className="error-message">{fieldErrors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="label">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                    required
                  />
                  {fieldErrors.email && (
                    <span className="error-message">{fieldErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="label">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                    required
                  />
                  {fieldErrors.password && (
                    <span className="error-message">{fieldErrors.password}</span>
                  )}
                  <div className="password-hints">
                    <span className={formData.password.length >= 8 ? 'valid' : ''}>• 8+ characters</span>
                    <span className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>• 1 uppercase</span>
                    <span className={/[a-z]/.test(formData.password) ? 'valid' : ''}>• 1 lowercase</span>
                    <span className={/\d/.test(formData.password) ? 'valid' : ''}>• 1 number</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="label">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input"
                    disabled
                  >
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="action-btn submit-btn" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span> Adding...
                      </>
                    ) : 'Add Employee'}
                  </button>
                  <button
                    type="button"
                    className="action-btn cancel-btn"
                    onClick={() => navigate('/projectview')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;