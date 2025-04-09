import React, { useState } from 'react';
import Sidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Objectifmanagement.css';
import axios from 'axios';
import ObjectiveAnalytics from '../Objectif/ObjectiveAnalytics';
// API base URL (replace with your backend URL)
const API_URL = 'http://localhost:3000/objectif';

const ObjectifDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { objective, selectedProject } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [objectiveStatus, setObjectiveStatus] = useState(objective?.status || 'Pending');

  // Retrieve JWT token from localStorage (replace with your token storage method)
  const token = localStorage.getItem('token');

  if (!objective) {
    return (
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="content">
            <h1 className="objectif-details-heading">Objective Details</h1>
            <p>No objective data available</p>
            <button 
              className="objectif-details-back-btn"
              onClick={() => navigate('/ObjectiveManagement')}
            >
              Back to Objectives
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEditObjective = () => {
    navigate('/EditObjective', { state: { objective, selectedProject } });
  };

  const handleUpdateProgress = () => {
    // Placeholder for update progress functionality
    // You can navigate to a progress update page or open a modal
    console.log('Update progress clicked');
  };

  const handleMarkAsCompleted = async () => {
    if (!token) {
      toast.error('Authentication token missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/complete/${objective._id}`,
        {}, // No body needed for this request
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setObjectiveStatus('Completed');
      toast.success('Objective marked as Completed successfully!');
      console.log('Mark as Completed response:', response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark objective as Completed';
      toast.error(errorMessage);
      console.error('Error marking objective as Completed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFailed = async () => {
    if (!token) {
      toast.error('Authentication token missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/fail/${objective._id}`,
        {}, // No body needed for this request
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setObjectiveStatus('Failed');
      toast.success('Objective marked as Failed successfully!');
      console.log('Mark as Failed response:', response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark objective as Failed';
      toast.error(errorMessage);
      console.error('Error marking objective as Failed:', error);
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
          <div className="objectif-details-header">
            <button 
              className="objectif-details-back-link objective-button"
              onClick={() => navigate('/ObjectiveManagement')}
              disabled={loading}
            >
              ← Back to Objectives
            </button>
            <div className="objectif-details-status">
              <span className="objectif-details-type">{objective.objectivetype}</span>
              <span className="objectif-details-status-label">{objectiveStatus}</span>
            </div>
          
          </div>
          
          <h1 className="objectif-details-heading">{objective.name}</h1>
          <div className="objectif-details-tabs">
            <button 
              className="objectif-details-tab objective-button"
              onClick={handleMarkAsCompleted}
              disabled={loading || objectiveStatus === 'Completed'}
            >
              {loading && objectiveStatus !== 'Failed' ? 'Marking...' : 'Mark as Completed'}
            </button>
            <button 
              className="objectif-details-tab objective-button"
              onClick={handleMarkAsFailed}
              disabled={loading || objectiveStatus === 'Failed'}
            >
              {loading && objectiveStatus !== 'Completed' ? 'Marking...' : 'Mark as Failed'}
            </button>
          </div>
          <div className="objectif-details-cards">
            
            {/* Timeline Card */}
            <div className="objectif-details-card">
              <div className="objectif-details-card-header">
                <span className="objectif-details-icon">📅</span>
                <h3>Timeline</h3>
              </div>
              <div className="objectif-details-card-content">
                <p>
                  <strong>Start Date:</strong> {new Date(objective.datedebut).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                </p>
                <p>
                  <strong>Due Date:</strong> {new Date(objective.datefin).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Target Amount Card */}
            <div className="objectif-details-card">
              <div className="objectif-details-card-header">
                <span className="objectif-details-icon">🎯</span>
                <h3>Target Amount</h3>
              </div>
              <div className="objectif-details-card-content">
                <p><strong>Target:</strong> ${objective.target_amount}</p>
                <p><strong>Budget Range:</strong> ${objective.minbudget} - ${objective.maxbudget}</p>
              </div>
            </div>

            {/* Progress Card */}
            <div className="objectif-details-card">
              <div className="objectif-details-card-header">
                <span className="objectif-details-icon">📊</span>
                <h3>Overall Progress</h3>
              </div>
              <div className="objectif-details-card-content">
                <p><strong>Completion:</strong> {objective.progress}%</p>
                <div className="objectif-details-progress-bar">
                  <div 
                    className="objectif-details-progress-fill"
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="objectif-details-description">
            <h3>Description</h3>
            <p>{objective.description}</p>
          </div>
          <ObjectiveAnalytics objectiveId={objective._id} />
          {/* Buttons */}
          <div className="objectif-details-buttons ">
            <button 
              className="objectif-details-edit-objective-btn objective-button"
              onClick={handleEditObjective}
              disabled={loading}
            >
              Edit Objective
            </button>
            <button 
              className="objectif-details-back-btn objective-button"
              onClick={() => navigate('/ObjectiveManagement')}
              disabled={loading}
            >
              Back to Objectives
            </button>
          </div>

          {/* Tabs (Updated with API calls) */}
          
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ObjectifDetails;