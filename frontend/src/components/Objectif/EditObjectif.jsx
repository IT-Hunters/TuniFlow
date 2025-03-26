import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate, useLocation } from 'react-router-dom';
import './Objectifmanagement.css';

const API_Objectif = 'http://localhost:3000/objectif';

const EditObjective = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { objective, selectedProject } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [editObjective, setEditObjective] = useState({
    ...objective,
    datedebut: objective?.datedebut
      ? new Date(objective.datedebut).toISOString().split('T')[0]
      : '',
    datefin: objective?.datefin
      ? new Date(objective.datefin).toISOString().split('T')[0]
      : '',
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChangeEdit = (e) => {
    const { name, value, type, checked } = e.target;
    setEditObjective((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProgressChange = (e) => {
    const value = e.target.value;
    setEditObjective((prev) => ({
      ...prev,
      progress: value,
    }));
    const sliderValue = document.querySelector('.PB-range-slidervalue');
    if (sliderValue) {
      sliderValue.textContent = `${value}%`;
    }
    if (errors.progress) {
      setErrors((prev) => ({ ...prev, progress: '' }));
    }
  };

  const handleUpdateObjective = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setErrors({ project: 'No project selected' });
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.put(
        `${API_Objectif}/updateobjectif/${editObjective._id}`,
        editObjective,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Objective updated successfully');
        setTimeout(() => navigate('/ObjectiveManagement'), 1000);
      }
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Failed to update objective',
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
        <div className="content">
          <h1>Edit Objective</h1>

          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}

          {loading && <div className="loading">Loading...</div>}

          <div className="create-objective-section">
            <form onSubmit={handleUpdateObjective}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={editObjective.name}
                  onChange={handleChangeEdit}
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
                  value={editObjective.description}
                  onChange={handleChangeEdit}
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
                  value={editObjective.target_amount}
                  onChange={handleChangeEdit}
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
                  value={editObjective.minbudget}
                  onChange={handleChangeEdit}
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
                  value={editObjective.maxbudget}
                  onChange={handleChangeEdit}
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
                  value={editObjective.datedebut}
                  onChange={handleChangeEdit}
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
                  value={editObjective.datefin}
                  onChange={handleChangeEdit}
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
                  value={editObjective.objectivetype}
                  onChange={handleChangeEdit}
                  className={errors.objectivetype ? 'input-error' : ''}
                >
                  <option value="BUDGET">Budget</option>
                  <option value="COST_REDUCTION">Cost Reduction</option>
                  <option value="REVENUE_GROWTH">Revenue Growth</option>
                  <option value="PROFIT_MARGIN">Profit Margin</option>
                  <option value="CASH_FLOW">Cash Flow</option>
                  <option value="INVESTMENT">Investment</option>
                  <option value="DEBT_MANAGEMENT">Debt Management</option>
                  <option value="EXPENSE_CONTROL">Expense Control</option>
                  <option value="TAX_OPTIMIZATION">Tax Optimization</option>
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
                    checked={editObjective.isStatic}
                    onChange={handleChangeEdit}
                    className={errors.isStatic ? 'input-error' : ''}
                  />
                </label>
                {errors.isStatic && (
                  <div className="field-error">{errors.isStatic}</div>
                )}
              </div>

              <div className="form-group">
                <label>Progress:</label>
                <div className="PB-range-slider-div">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editObjective.progress || 0}
                    className={`PB-range-slider ${
                      errors.progress ? 'input-error' : ''
                    }`}
                    id="myRange"
                    onChange={handleProgressChange}
                  />
                  <p className="PB-range-slidervalue">
                    {editObjective.progress || 0}%
                  </p>
                </div>
                {errors.progress && (
                  <div className="field-error">{errors.progress}</div>
                )}
              </div>

              {errors.project && (
                <div className="field-error">{errors.project}</div>
              )}

              <div className="button-group">
                <button type="submit" disabled={loading}>
                  Update Objective
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

export default EditObjective;