import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './MyProject.css'; // Corrected CSS import

const API_URL = 'http://localhost:3000/users';

const AddUser = () => {
  const [formData, setFormData] = useState({
    role: '',
    fullname: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.role) newErrors.role = 'Please select a role.';
    if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required.';
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!formData.confirm) newErrors.confirm = 'Please confirm your password.';
    else if (formData.password !== formData.confirm) newErrors.confirm = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess(null);
  
    if (!validateForm()) {
      setLoading(false);
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
  
      const response = await axios.post(
        `${API_URL}/registerwithproject`,
        {
          role: formData.role,
          fullname: formData.fullname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          confirm: formData.confirm // Ajoutez ce champ
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      setSuccess(response.data.message);
      setFormData({
        role: '',
        fullname: '',
        lastname: '',
        email: '',
        password: '',
        confirm: '',
      });
  
    
      setTimeout(() => navigate('/MyProject', { state: { refresh: true } }), 2000);
    } catch (err) {
      console.error('Add User Error:', err.response?.data || err.message); // Log full response
      const errorData = err.response?.data;
      if (err.response?.status === 400 && errorData.errors) {
        setErrors(errorData.errors);
      } else if (err.response?.status === 409) {
        setErrors({ email: 'User already exists.' });
      } else if (err.response?.status === 403) {
        setErrors({ general: 'Access denied. Only a Business Manager can register users.' });
      } else if (err.response?.status === 404) {
        setErrors({ general: errorData.message || 'Project not found.' });
      } else {
        setErrors({ general: errorData?.message || 'Failed to add user: ' + err.message });
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
          <h1>Add New User</h1>
          <div className="form-container card">
            {success && <div className="alert alert-success">{success}</div>}
            {errors.general && <div className="alert alert-error">{errors.general}</div>}
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  disabled={loading}
                >
                  <option value="">Select Role</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="FINANCIAL_MANAGER">Financial Manager</option>
                  <option value="RH">RH Manager</option>
                </select>
                {errors.role && <span className="field-error">{errors.role}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleFormChange}
                  disabled={loading}
                />
                {errors.fullname && <span className="field-error">{errors.fullname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastname">Last Name</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleFormChange}
                  disabled={loading}
                />
                {errors.lastname && <span className="field-error">{errors.lastname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  disabled={loading}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  disabled={loading}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleFormChange}
                  disabled={loading}
                />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add User'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/MyProject')}
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

export default AddUser;