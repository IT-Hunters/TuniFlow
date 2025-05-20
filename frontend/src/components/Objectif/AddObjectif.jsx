import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from '@/axios'
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate, useLocation } from 'react-router-dom';
import './Objectifmanagement.css';

const API_Objectif = '/objectif';

const AddObjective = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [newObjective, setNewObjective] = useState({
    name: '',
    description: '',
    target_amount: '',
    minbudget: '',
    maxbudget: '',
    datedebut: '',
    datefin: '',
    objectivetype: 'BUDGET',
    isStatic: false,
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewObjective((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateObjective = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setErrors({ project: 'No project selected' });
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      console.log('Token retrieved from localStorage:', token); // Debug log
      if (!token) {
        setErrors({ general: 'No authentication token found. Please log in again.' });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const objectiveData = { ...newObjective, project: selectedProject };
      console.log('Creating objective with data:', objectiveData); // Debug log
      const response = await axios.post(
        `${API_Objectif}/createobjectifs`,
        objectiveData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Objective created successfully');
        setNewObjective({
          name: '',
          description: '',
          target_amount: '',
          minbudget: '',
          maxbudget: '',
          datedebut: '',
          datefin: '',
          objectivetype: 'BUDGET',
          isStatic: false,
        });
        setTimeout(() => navigate('/ObjectiveManagement'), 1000);
      }
    } catch (err) {
      console.error('Error creating objective:', err.response?.data || err.message);
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Failed to create objective',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="form_content">
          <h1>Add New Objective</h1>

          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}

          {loading && <div className="loading">Loading...</div>}

          <div className="create-objective-section">
            <form onSubmit={handleCreateObjective}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={newObjective.name}
                  onChange={handleChange}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && (
                  <div className="field-error">{errors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={newObjective.description}
                  onChange={handleChange}
                  className={errors.description ? 'input-error' : ''}
                />
                {errors.description && (
                  <div className="field-error">{errors.description}</div>
                )}
              </div>

              <div className="form-group">
                <label>Target Amount:</label>
                <input
                  type="number"
                  name="target_amount"
                  placeholder="Target Amount"
                  value={newObjective.target_amount}
                  onChange={handleChange}
                  className={errors.target_amount ? 'input-error' : ''}
                />
                {errors.target_amount && (
                  <div className="field-error">{errors.target_amount}</div>
                )}
              </div>

              <div className="form-group">
                <label>Minimum Budget:</label>
                <input
                  type="number"
                  name="minbudget"
                  placeholder="Minimum Budget"
                  value={newObjective.minbudget}
                  onChange={handleChange}
                  className={errors.minbudget ? 'input-error' : ''}
                />
                {errors.minbudget && (
                  <div className="field-error">{errors.minbudget}</div>
                )}
              </div>

              <div className="form-group">
                <label>Maximum Budget:</label>
                <input
                  type="number"
                  name="maxbudget"
                  placeholder="Maximum Budget"
                  value={newObjective.maxbudget}
                  onChange={handleChange}
                  className={errors.maxbudget ? 'input-error' : ''}
                />
                {errors.maxbudget && (
                  <div className="field-error">{errors.maxbudget}</div>
                )}
              </div>

              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  name="datedebut"
                  value={newObjective.datedebut}
                  onChange={handleChange}
                  className={errors.datedebut ? 'input-error' : ''}
                />
                {errors.datedebut && (
                  <div className="field-error">{errors.datedebut}</div>
                )}
              </div>

              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  name="datefin"
                  value={newObjective.datefin}
                  onChange={handleChange}
                  className={errors.datefin ? 'input-error' : ''}
                />
                {errors.datefin && (
                  <div className="field-error">{errors.datefin}</div>
                )}
              </div>

              <div className="form-group">
                <label>Objective Type:</label>
                <select
                  name="objectivetype"
                  value={newObjective.objectivetype}
                  onChange={handleChange}
                  className={errors.objectivetype ? 'input-error' : ''}
                >
                  {[
                    'BUDGET',
                    'COST_REDUCTION',
                    'REVENUE_GROWTH',
                    'PROFIT_MARGIN',
                    'CASH_FLOW',
                    'INVESTMENT',
                    'DEBT_MANAGEMENT',
                    'EXPENSE_CONTROL',
                    'TAX_OPTIMIZATION',
                  ].map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.objectivetype && (
                  <div className="field-error">{errors.objectivetype}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  Static Objective:
                  <input
                    type="checkbox"
                    name="isStatic"
                    checked={newObjective.isStatic}
                    onChange={handleChange}
                    className={errors.isStatic ? 'input-error' : ''}
                  />
                </label>
                {errors.isStatic && (
                  <div className="field-error">{errors.isStatic}</div>
                )}
              </div>

              {errors.project && (
                <div className="field-error">{errors.project}</div>
              )}

              <div className="button-group">
                <button type="submit" disabled={loading}>
                  Create Objective
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ObjectiveManagement')}
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

export default AddObjective;