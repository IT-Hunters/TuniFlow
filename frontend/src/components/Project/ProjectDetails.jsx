import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProjectDetails.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import { AlertCircle, CheckCircle, HelpCircle, TrendingUp, DollarSign, AlertTriangle, BarChart2 } from "lucide-react"
import Navbar from '../navbarHome/NavbarHome';
import recommendationService from '../../services/AiService';

const API_URL = 'http://localhost:3000/project/getbyid';
const GENERATE_REPORT_URL = 'http://localhost:3000/project/generate-report';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullObjectives, setFullObjectives] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isAiResultsVisible, setIsAiResultsVisible] = useState(false);
  const [aiStage, setAiStage] = useState("idle") 

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProject(response.data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err.response?.data?.message || 'Failed to load project details');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login WARN: ProjectDetails.jsx:61');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchFullObjectives = useCallback(async () => {
    if (!project?.objectifs || project.objectifs.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const requests = project.objectifs.map((objId) =>
        axios.get(`http://localhost:3000/objectif/getbyid/${objId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const responses = await Promise.all(requests);
      setFullObjectives(responses.map((res) => res.data));
    } catch (error) {
      console.error('Error fetching objectives details:', error);
    }
  }, [project?.objectifs]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  useEffect(() => {
    fetchFullObjectives();
  }, [fetchFullObjectives]);

  const handleDelete = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:3000/project/deleteProjectById/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Project deleted successfully!');
        navigate('/OwnerProjectsView');
      } else {
        alert('Failed to delete project!');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('An error occurred while deleting the project.');
    }
  };
  const getInsightIcon = (type) => {
    switch (type) {
      case "funding":
        return <DollarSign className="insight-icon funding" />
      case "health":
        return <CheckCircle className="insight-icon health" />
      case "priority":
        return <AlertCircle className="insight-icon priority" />
      case "behavior":
        return <BarChart2 className="insight-icon behavior" />
      default:
        return <TrendingUp className="insight-icon" />
    }
  }
  const getConfidenceMessage = (confidence) => {
    if (confidence >= 0.8) return "High confidence"
    if (confidence >= 0.5) return "Medium confidence"
    return "Low confidence"
  }

  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${GENERATE_REPORT_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(response.data);
      link.download = `project-${id}-report.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleFetchAiResults = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiStage("analyzing")

    try {
      const token = localStorage.getItem("token")
      const userId = project?.businessOwner?._id
      if (!userId) {
        throw new Error("Business owner ID not found")
      }

      // Simulate progressive loading for better UX
      const progressSteps = [
        { message: "Initializing financial analysis...", delay: 500 },
        { message: "Analyzing project data...", delay: 1000 },
        { message: "Processing transaction patterns...", delay: 1500 },
        { message: "Generating recommendations...", delay: 1000 },
      ]

      for (const step of progressSteps) {
        setAiError(step.message)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, step.delay))
      }

      const [projectRecommendation, prediction, priorityPrediction, spendingBehaviorPrediction] = await Promise.all([
        recommendationService.getProjectRecommendation(id, token),
        recommendationService.getPrediction(userId, token),
        recommendationService.getPriorityPrediction(userId, token),
        recommendationService.getSpendingBehaviorPrediction(userId, token),
      ])

      setAiResults({
        projectRecommendation,
        prediction,
        priorityPrediction,
        spendingBehaviorPrediction,
      })

      setIsAiResultsVisible(true)
      setAiStage("success")
      setAiError(null)
    } catch (err) {
      console.error("Error fetching AI results:", err)
      setAiError(`Failed to load financial recommendations: ${err.message}`)
      setAiStage("error")
    } finally {
      setAiLoading(false)
    }
  }

  const toggleAiResults = () => {
    setIsAiResultsVisible(!isAiResultsVisible);
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
        <button onClick={() => window.location.reload()} className="action-btn retry-btn">
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
        <div className="project-details-wrapper">
          <Link to="/OwnerProjectsView" className="back-link">
            ← Back to All Projects
          </Link>
          <header className="project-header">
            <h1 className="project-title">
              {project.name || `Project ${project._id.slice(-4)}`}
            </h1>
            <div className="action-buttons">
              <Link to={`/projects/${id}/edit`} className="action-btn edit-btn">
                Edit Project
              </Link>
              <button onClick={() => handleDelete(project._id)} className="action-btn delete-btn">
                Delete Project
              </button>
              <button
                onClick={handleGenerateReport}
                className="action-btn report-btn"
              >
                Generate Report
              </button>
            </div>
          </header>

          <div className="project-layout">
            {/* Left Column: Project Details */}
            <section className="project-details">
              <div className="detail-card">
                <h2 className="card-title">Project Information</h2>
                <ul className="detail-list">
                  <li className="detail-item">
                    <span className="label">Status</span>
                    <span className={`status ${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Budget</span>
                    <span>{project.amount ? `$${project.amount.toLocaleString()}` : 'N/A'}</span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Start Date</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </li>
                  <li className="detail-item">
                    <span className="label">End Date</span>
                    <span>{formatDate(project.due_date) || 'Ongoing'}</span>
                  </li>
                </ul>
              </div>

              <div className="detail-card">
                <h2 className="card-title">Description</h2>
                <p className="description">{project.description || 'No description provided.'}</p>
              </div>

              {/* Enhanced AI Features Section */}
              <div className={`detail-card ai-features ${aiStage}`}>
                <div className="ai-header">
                  <h2 className="card-title">
                    <TrendingUp className="section-icon" />
                    Financial AI Insights
                  </h2>
                  {aiResults && (
                    <button
                      onClick={toggleAiResults}
                      className="toggle-ai-btn"
                      aria-label={isAiResultsVisible ? "Hide insights" : "Show insights"}
                    >
                      {isAiResultsVisible ? "Hide Insights" : "Show Insights"}
                    </button>
                  )}
                </div>

                <div className="ai-content">
                  <div className="ai-description-container">
                    <p className="ai-description">
                      Our AI-powered financial analysis provides personalized insights to optimize your project's
                      financial strategy. Get recommendations on funding options, financial health assessment, and
                      spending behavior analysis.
                    </p>

                    {aiStage === "idle" && (
                      <div className="ai-benefits">
                        <div className="benefit-item">
                          <DollarSign className="benefit-icon" />
                          <span>Funding optimization</span>
                        </div>
                        <div className="benefit-item">
                          <TrendingUp className="benefit-icon" />
                          <span>Financial health assessment</span>
                        </div>
                        <div className="benefit-item">
                          <AlertCircle className="benefit-icon" />
                          <span>Risk identification</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ai-action-container">
                    {aiStage === "idle" && (
                      <button
                        onClick={handleFetchAiResults}
                        className="ai-btn"
                        disabled={aiLoading}
                        aria-label="Run financial analysis"
                      >
                        <TrendingUp className="btn-icon" />
                        Run Financial Analysis
                      </button>
                    )}

                    {aiStage === "analyzing" && (
                      <div className="ai-loading-container">
                        <div className="ai-loading-animation">
                          <div className="spinner-container">
                            <div className="spinner"></div>
                          </div>
                          <div className="progress-steps">
                            <div className="progress-bar">
                              <div className="progress-fill analyzing"></div>
                            </div>
                          </div>
                        </div>
                        <p className="ai-status-message">{aiError || "Analyzing financial data..."}</p>
                      </div>
                    )}

                    {aiStage === "error" && (
                      <div className="ai-error-container">
                        <AlertTriangle className="error-icon" />
                        <p className="error-message">{aiError}</p>
                        <button onClick={handleFetchAiResults} className="retry-btn" aria-label="Retry analysis">
                          Retry Analysis
                        </button>
                      </div>
                    )}

                    {aiStage === "success" && !isAiResultsVisible && (
                      <div className="ai-success-container">
                        <CheckCircle className="success-icon" />
                        <p className="success-message">Analysis complete! View your financial insights.</p>
                        <button onClick={toggleAiResults} className="view-results-btn" aria-label="View insights">
                          View Insights
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {aiResults && isAiResultsVisible && (
                  <div className="ai-results-container">
                    <h3 className="results-heading">Financial Insights</h3>
                    <p className="results-description">
                      Based on your project data and transaction patterns, our AI has generated the following insights:
                    </p>

                    <div className="ai-results-grid">
                      {/* Funding Recommendation */}
                      <div className="insight-card funding">
                        <div className="insight-header">
                          {getInsightIcon("funding")}
                          <h4>Funding Recommendation</h4>
                          <div className="tooltip">
                            <HelpCircle className="help-icon" />
                            <span className="tooltip-text">
                              Optimal funding strategy based on project financials and market analysis
                            </span>
                          </div>
                        </div>

                        <div className="insight-content">
                          <p className="insight-value">{aiResults.projectRecommendation.bestRecommendation}</p>

                          <div className="confidence-container">
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${(aiResults.projectRecommendation.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="confidence-label">
                              {getConfidenceMessage(aiResults.projectRecommendation.confidence || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Health */}
                      <div className="insight-card health">
                        <div className="insight-header">
                          {getInsightIcon("health")}
                          <h4>Financial Health</h4>
                          <div className="tooltip">
                            <HelpCircle className="help-icon" />
                            <span className="tooltip-text">
                              Assessment of financial stability based on cash flow and transaction patterns
                            </span>
                          </div>
                        </div>

                        <div className="insight-content">
                          <p className="insight-value">{aiResults.prediction.bestPrediction}</p>

                          <div className="confidence-container">
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${(aiResults.prediction.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="confidence-label">
                              {getConfidenceMessage(aiResults.prediction.confidence || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Priority */}
                      <div className="insight-card priority">
                        <div className="insight-header">
                          {getInsightIcon("priority")}
                          <h4>Transaction Priority</h4>
                          <div className="tooltip">
                            <HelpCircle className="help-icon" />
                            <span className="tooltip-text">
                              Identifies urgent transactions and critical expenses for prioritization
                            </span>
                          </div>
                        </div>

                        <div className="insight-content">
                          <p className="insight-value">{aiResults.priorityPrediction.bestPrediction}</p>

                          <div className="confidence-container">
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${(aiResults.priorityPrediction.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="confidence-label">
                              {getConfidenceMessage(aiResults.priorityPrediction.confidence || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Spending Behavior */}
                      <div className="insight-card behavior">
                        <div className="insight-header">
                          {getInsightIcon("behavior")}
                          <h4>Spending Behavior</h4>
                          <div className="tooltip">
                            <HelpCircle className="help-icon" />
                            <span className="tooltip-text">
                              Analysis of spending patterns to inform risk and investment strategies
                            </span>
                          </div>
                        </div>

                        <div className="insight-content">
                          <p className="insight-value">{aiResults.spendingBehaviorPrediction.bestPrediction}</p>

                          <div className="confidence-container">
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${(aiResults.spendingBehaviorPrediction.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="confidence-label">
                              {getConfidenceMessage(aiResults.spendingBehaviorPrediction.confidence || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ai-actions">
                      <button className="action-link" onClick={handleGenerateReport}>
                        <BarChart2 className="action-icon" />
                        Generate Detailed Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Taxes Section */}
              <div className="detail-card">
                <h2 className="card-title">Taxes</h2>
                {project.taxes?.length > 0 ? (
                  <div className="grid-container">
                    {project.taxes.map((tax) => (
                      <div key={tax._id} className="info-card">
                        <h3>{tax.nom_taxe}</h3>
                        <div className="info-details">
                          <p><strong>Category:</strong> {tax.categorie}</p>
                          <p><strong>Rate:</strong> ${tax.taux}</p>
                          <p><strong>Effective Date:</strong> {formatDate(tax.date_effet)}</p>
                          <p><strong>Description:</strong> {tax.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No taxes assigned</p>
                )}
              </div>

              {/* Objectives Section */}
              <div className="detail-card">
                <h2 className="card-title">Objectives</h2>
                {fullObjectives.length > 0 ? (
                  <div className="grid-container">
                    {fullObjectives.map((objectif) => (
                      <div key={objectif._id} className="info-card">
                        <h3>{objectif.name || 'Unnamed Objective'}</h3>
                        <div className="info-details">
                          <p>
                            <strong>Status:</strong>{' '}
                            <span className={`status ${(objectif.status || '').toLowerCase()}`}>
                              {objectif.status || 'Not specified'}
                            </span>
                          </p>
                          <p><strong>Type:</strong> {objectif.objectivetype || 'Not specified'}</p>
                          <p><strong>Description:</strong> {objectif.description || 'No description'}</p>
                          <p><strong>Target Amount:</strong> ${objectif.target_amount?.toLocaleString() || '0'}</p>
                          <p>
                            <strong>Budget Range:</strong> ${objectif.minbudget?.toLocaleString() || '0'} - $
                            {objectif.maxbudget?.toLocaleString() || '0'}
                          </p>
                          <p>
                            <strong>Period:</strong> {formatDate(objectif.datedebut)} to{' '}
                            {formatDate(objectif.datefin)}
                          </p>
                          <div className="progress-container">
                            <label>
                              <strong>Progress:</strong> {objectif.progress || 0}%
                            </label>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${objectif.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : project.objectifs?.length > 0 ? (
                  <p className="no-data">Loading objectives...</p>
                ) : (
                  <p className="no-data">No objectives defined</p>
                )}
              </div>

              {/* Assets Section */}
              <div className="detail-card">
                <h2 className="card-title">Active Assets</h2>
                {project.assets_actif?.length > 0 ? (
                  <div className="grid-container">
                    {project.assets_actif.map((asset) => (
                      <div key={asset._id} className="info-card">
                        <h3>{asset.name}</h3>
                        <div className="info-details">
                          <p><strong>Type:</strong> {asset.type_actif}</p>
                          <p><strong>Value:</strong> ${asset.total_value?.toLocaleString()}</p>
                          <p><strong>Acquisition Date:</strong> {formatDate(asset.date_acquisition)}</p>
                          <p><strong>Corporeal Type:</strong> {asset.type_corporel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No active assets</p>
                )}
              </div>

              {/* Obligations Fiscales Section */}
              {project.obligations_fiscales?.length > 0 && (
                <div className="detail-card">
                  <h2 className="card-title">Fiscal Obligations</h2>
                  <div className="grid-container">
                    {project.obligations_fiscales.map((obligation) => (
                      <div key={obligation._id} className="info-card">
                        <h3>{obligation.name || `Obligation ${obligation._id.slice(-4)}`}</h3>
                        <div className="info-details">
                          <p><strong>Description:</strong> {obligation.description || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Right Column: Team Members */}
            <aside className="team-section">
              <h2 className="section-title">Team Members</h2>
              <div className="team-list">
                <div className="team-card">
                  <h3 className="team-role">Business Owner</h3>
                  <p className="team-name">{project.businessOwner?.fullname || 'Not assigned'}</p>
                  <p className="team-email">{project.businessOwner?.email || '-'}</p>
                </div>
                <div className="team-card">
                  <h3 className="team-role">Business Manager</h3>
                  <p className="team-name">{project.businessManager?.fullname || 'Not assigned'}</p>
                  <p className="team-email">{project.businessManager?.email || '-'}</p>
                </div>
                <div className="team-card">
                  <h3 className="team-role">Accountants</h3>
                  {project.accountants?.length > 0 ? (
                    project.accountants.map((acc) => (
                      <div key={acc._id} className="team-subitem">
                        <p className="team-name">{acc.fullname}</p>
                        <p className="team-email">{acc.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
                <div className="team-card">
                  <h3 className="team-role">Financial Managers</h3>
                  {project.financialManagers?.length > 0 ? (
                    project.financialManagers.map((fm) => (
                      <div key={fm._id} className="team-subitem">
                        <p className="team-name">{fm.fullname}</p>
                        <p className="team-email">{fm.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
                <div className="team-card">
                  <h3 className="team-role">HR Managers</h3>
                  {project.rhManagers?.length > 0 ? (
                    project.rhManagers.map((rh) => (
                      <div key={rh._id} className="team-subitem">
                        <p className="team-name">{rh.fullname}</p>
                        <p className="team-email">{rh.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">None assigned</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;