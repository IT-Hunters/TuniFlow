import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [editObjective, setEditObjective] = useState({
    ...objective,
    datedebut: objective.datedebut ? new Date(objective.datedebut).toISOString().split('T')[0] : '',
    datefin: objective.datefin ? new Date(objective.datefin).toISOString().split('T')[0] : ''
  });

  const handleUpdateObjective = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API_Objectif}/updateobjectif/${editObjective._id}`, editObjective, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate('/objectives');
    } catch (err) {
      setError('Failed to update objective');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEdit = (e) => {
    const { name, value, type, checked } = e.target;
    setEditObjective(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProgressChange = (e) => {
    const value = e.target.value;
    setEditObjective(prev => ({
      ...prev,
      progress: value
    }));
    const sliderValue = document.querySelector('.PB-range-slidervalue');
    if (sliderValue) {
      sliderValue.textContent = `${value}%`;
    }
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h1>Edit Objective</h1>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          <div className="create-objective-section">
            <form onSubmit={handleUpdateObjective}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={editObjective.name}
                onChange={handleChangeEdit}
              />
              <textarea
                name="description"
                placeholder="Description"
                value={editObjective.description}
                onChange={handleChangeEdit}
              />
              <input
                type="number"
                name="target_amount"
                placeholder="Target Amount"
                value={editObjective.target_amount}
                onChange={handleChangeEdit}
              />
              <input
                type="number"
                name="minbudget"
                placeholder="Minimum Budget"
                value={editObjective.minbudget}
                onChange={handleChangeEdit}
              />
              <input
                type="number"
                name="maxbudget"
                placeholder="Maximum Budget"
                value={editObjective.maxbudget}
                onChange={handleChangeEdit}
              />
              <input
                type="date"
                name="datedebut"
                value={editObjective.datedebut}
                onChange={handleChangeEdit}
              />
              <input
                type="date"
                name="datefin"
                value={editObjective.datefin}
                onChange={handleChangeEdit}
              />
              <select
                name="objectivetype"
                value={editObjective.objectivetype}
                onChange={handleChangeEdit}
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
              <label>
                Static Objective:
                <input
                  type="checkbox"
                  name="isStatic"
                  checked={editObjective.isStatic}
                  onChange={handleChangeEdit}
                />
              </label>
              <div className="PB-range-slider-div">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editObjective.progress || 0}
                  className="PB-range-slider"
                  id="myRange"
                  onChange={handleProgressChange}
                />
                <p className="PB-range-slidervalue">{editObjective.progress || 0}%</p>
              </div>
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditObjective;