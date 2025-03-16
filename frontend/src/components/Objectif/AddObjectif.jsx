import  { useState } from 'react';
import axios from 'axios';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate, useLocation } from 'react-router-dom';
import './Objectifmanagement.css';

const API_Objectif = 'http://localhost:3000/objectif';

const AddObjective = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newObjective, setNewObjective] = useState({
    name: '',
    description: '',
    target_amount: '',
    minbudget: '',
    maxbudget: '',
    datedebut: '',
    datefin: '',
    objectivetype: 'BUDGET',
    isStatic: false
  });

  const handleCreateObjective = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const objectiveData = {
        ...newObjective,
        project: selectedProject
      };
      await axios.post(`${API_Objectif}/createobjectifs`, objectiveData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate('/objectives');
    } catch (err) {
      setError('Failed to create objective');
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
          <h1>Add New Objective</h1>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          <div className="create-objective-section">
            <form onSubmit={handleCreateObjective}>
              <input
                type="text"
                placeholder="Name"
                value={newObjective.name}
                onChange={(e) => setNewObjective({ ...newObjective, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={newObjective.description}
                onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Target Amount"
                value={newObjective.target_amount}
                onChange={(e) => setNewObjective({ ...newObjective, target_amount: e.target.value })}
              />
              <input
                type="number"
                placeholder="Minimum Budget"
                value={newObjective.minbudget}
                onChange={(e) => setNewObjective({ ...newObjective, minbudget: e.target.value })}
              />
              <input
                type="number"
                placeholder="Maximum Budget"
                value={newObjective.maxbudget}
                onChange={(e) => setNewObjective({ ...newObjective, maxbudget: e.target.value })}
              />
              <input
                type="date"
                value={newObjective.datedebut}
                onChange={(e) => setNewObjective({ ...newObjective, datedebut: e.target.value })}
              />
              <input
                type="date"
                value={newObjective.datefin}
                onChange={(e) => setNewObjective({ ...newObjective, datefin: e.target.value })}
              />
              <select
                value={newObjective.objectivetype}
                onChange={(e) => setNewObjective({ ...newObjective, objectivetype: e.target.value })}
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
                  checked={newObjective.isStatic}
                  onChange={(e) => setNewObjective({ ...newObjective, isStatic: e.target.checked })}
                />
              </label>
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddObjective;