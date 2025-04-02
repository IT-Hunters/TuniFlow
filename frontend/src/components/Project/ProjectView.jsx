import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProjectView.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/users';

const ProjectView = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/findMyProject`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.id) {
          throw new Error("Le projet retourné n'a pas d'ID");
        }

        setProject(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération du projet:', err);
        setError(err.response?.data?.message || err.message || 'Échec du chargement du projet');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [navigate]);

  const generateReport = async (projectId) => {
    if (!projectId) {
      alert("Impossible de générer le rapport : ID du projet manquant");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/project/generate-report/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-projet-${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Erreur lors de la génération du rapport:", err);
      alert(`Erreur lors de la génération du rapport: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Chargement du projet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container error">
        <h3>Oups, quelque chose s'est mal passé</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="action-btn retry-btn">
          Réessayer
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="state-container empty">
        <h3>Aucun projet assigné</h3>
        <p>Vous n'êtes actuellement assigné à aucun projet.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="project-view-wrapper">
          <header className="project-header">
            <h1 className="project-title">
              {project.name || `Projet ${project.id?.slice(-4) || 'Sans nom'}`}
            </h1>
            <p className="project-description">{project.description}</p>
          </header>

          <section className="project-layout">
            <div className="detail-card">
              <button
                className="action-btn generate-btn"
                onClick={() => generateReport(project.id)}
                disabled={!project.id}
              >
                Générer Rapport
              </button>

              <h2 className="card-title">Détails du Projet</h2>
              <ul className="detail-list">
                <li className="detail-item">
                  <span className="label">Statut</span>
                  <span className={`status ${project.status?.toLowerCase()}`}>
                    {project.status}
                  </span>
                </li>
                <li className="detail-item">
                  <span className="label">Date de début</span>
                  <span>
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </li>
                <li className="detail-item">
                  <span className="label">Date de fin</span>
                  <span>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Non spécifiée'}
                  </span>
                </li>
                
                <li className="detail-item">
                  <span className="label">Actifs</span>
                  {project.assets_actif?.length > 0 ? (
                    <ul className="assets-list">
                      {project.assets_actif.map((asset) => (
                        <li key={asset._id}>
                          <strong>{asset.name}</strong> - {asset.total_value}$
                          <div className="asset-details">
                            <span>Type: {asset.type_actif}</span>
                            <span>Acquis le: {new Date(asset.date_acquisition).toLocaleDateString()}</span>
                            <span>Catégorie: {asset.type_corporel}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>Aucun actif enregistré</span>
                  )}
                </li>
              </ul>
            </div>

            <div className="team-card">
              <h2 className="card-title">Équipe du Projet</h2>
              <div className="team-grid">
                <div className="team-section">
                  <h3 className="team-role">Propriétaire</h3>
                  <div className="team-member">
                    <p className="member-name">{project.businessOwner?.fullname}</p>
                    <p className="member-email">{project.businessOwner?.email}</p>
                  </div>
                </div>

                <div className="team-section">
                  <h3 className="team-role">Comptables</h3>
                  {project.teamMembers?.accountants?.length > 0 ? (
                    project.teamMembers.accountants.map((acc) => (
                      <div key={acc._id} className="team-member">
                        <p className="member-name">{acc.fullname}</p>
                        <p className="member-email">{acc.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun comptable assigné</p>
                  )}
                </div>

                <div className="team-section">
                  <h3 className="team-role">Responsables Financiers</h3>
                  {project.teamMembers?.financialManagers?.length > 0 ? (
                    project.teamMembers.financialManagers.map((fm) => (
                      <div key={fm._id} className="team-member">
                        <p className="member-name">{fm.fullname}</p>
                        <p className="member-email">{fm.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun responsable financier assigné</p>
                  )}
                </div>

                <div className="team-section">
                  <h3 className="team-role">Responsables RH</h3>
                  {project.teamMembers?.rhManagers?.length > 0 ? (
                    project.teamMembers.rhManagers.map((rh) => (
                      <div key={rh._id} className="team-member">
                        <p className="member-name">{rh.fullname}</p>
                        <p className="member-email">{rh.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun responsable RH assigné</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;