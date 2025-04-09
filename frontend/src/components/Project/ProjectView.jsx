import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './ProjectView.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';

const API_URL = 'http://localhost:3000/users';

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

const ProjectView = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // Récupérer les infos utilisateur depuis le token
  const token = localStorage.getItem('token');
  const decodedToken = token ? decodeJWT(token) : null;
  const userRole = decodedToken?.role;
  const userId = decodedToken?.userId;

  useEffect(() => {
    const fetchProject = async () => {
      try {
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
  }, [navigate, token]);

  const generateReport = async (projectId) => {
    if (!projectId) {
      alert("Impossible de générer le rapport : ID du projet manquant");
      return;
    }

    try {
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

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'http://localhost:3000/users/upload-employees',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert(`Succès: ${response.data.message}`);
      // Rafraîchir les données
      const projectResponse = await axios.get(`${API_URL}/findMyProject`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(projectResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message || 'Erreur inconnue'}`);
    } finally {
      setIsUploading(false);
      // Réinitialiser la valeur du input pour permettre le re-upload du même fichier
      event.target.value = '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className="project-details-wrapper">
          <header className="project-header">
            <h1 className="project-title">
              {project.name || `Projet ${project.id?.slice(-4) || 'Sans nom'}`}
            </h1>
            <div className="action-buttons">
              {userRole === 'RH' && (
                <>
                  <button 
                    onClick={() => navigate('/add-employee')} 
                    className="action-btn add-employee-btn"
                    style={{ backgroundColor: '#2196F3', color: 'white', marginRight: '10px' }}
                  >
                    Ajouter Employé
                  </button>
                  
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                      type="file"
                      id="excel-upload"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={handleExcelUpload}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="excel-upload"
                      className="action-btn add-excel-btn"
                      style={{ 
                        backgroundColor: isUploading ? '#cccccc' : '#FF9800', 
                        color: 'white', 
                        cursor: isUploading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isUploading ? 'Import en cours...' : 'Ajouter Employés via Excel'}
                    </label>
                    {isUploading && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}>
                        <div className="spinner"></div>
                      </div>
                    )}
                  </div>
                </>
              )}
              <button 
                onClick={() => generateReport(project.id)} 
                className="action-btn generate-report-btn"
                style={{ backgroundColor: '#4CAF50', color: 'white' }}
              >
                Générer Rapport
              </button>
            </div>
          </header>
        

          <div className="project-layout">
            {/* Colonne de gauche : Détails du projet */}
            <section className="project-details">
              <div className="detail-card">
                <h2 className="card-title">Informations du Projet</h2>
                <ul className="detail-list">
                  <li className="detail-item">
                    <span className="label">Statut</span>
                    <span className={`status ${project.status?.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Date de début</span>
                    <span>{formatDate(project.startDate)}</span>
                  </li>
                  <li className="detail-item">
                    <span className="label">Date de fin</span>
                    <span>{formatDate(project.endDate) || 'En cours'}</span>
                  </li>
                </ul>
              </div>

              <div className="detail-card">
                <h2 className="card-title">Description</h2>
                <p className="description">
                  {project.description || 'Aucune description fournie.'}
                </p>
              </div>

               {/* Section Objectifs */}
<div className="detail-card">
  <h2 className="card-title">Objectifs</h2>
  {project.objectifs?.length > 0 ? (
    <div className="objectifs-container">
      {project.objectifs.map(objectif => (
        <div key={objectif._id} className="objectif-card">
          <div className="objectif-header">
            <h3>{objectif.name}</h3>
            <span>Status:</span>
            <span className={`status-badge ${objectif.status.toLowerCase()}`}>
  {objectif.status}
</span>

            <span className={`status-badge ${objectif.status.toLowerCase()}`}>
</span>

          </div>
          
          <p className="objectif-description">{objectif.description}</p>
          
          <div className="objectif-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${objectif.progress}%` }}
              ></div>
            </div>
            <span>Progress:</span>
            <span className="progress-text">{objectif.progress}%</span>
          </div>
          
          <div className="objectif-details">
            <div className="detail-row">
              <span>Montant cible:</span>
              <strong>{objectif.target_amount.toLocaleString()} $</strong>
            </div>
            <div className="detail-row">
              <span>Budget:</span>
              <strong>
                {objectif.minbudget.toLocaleString()} $ - {objectif.maxbudget.toLocaleString()} $
              </strong>
            </div>
            <div className="detail-row">
              <span>Période:</span>
              <strong>
                {formatDate(objectif.datedebut)} au {formatDate(objectif.datefin)}
              </strong>
            </div>
            <div className="detail-row">
              <span>Type:</span>
              <strong>{objectif.objectivetype}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="no-data">Aucun objectif défini</p>
  )}
</div>

              {/* Section Taxes */}
              <div className="detail-card">
                <h2 className="card-title">Taxes</h2>
                {project.taxes?.length > 0 ? (
                  <div className="grid-container">
                    {project.taxes.map(tax => (
                      <div key={tax._id} className="info-card">
                        <h3>{tax.nom_taxe}</h3>
                        <div className="info-details">
                          <p><strong>Catégorie:</strong> {tax.categorie}</p>
                          <p><strong>Taux:</strong> {tax.taux}%</p>
                          <p><strong>Date d'effet:</strong> {formatDate(tax.date_effet)}</p>
                          <p><strong>Description:</strong> {tax.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucune taxe assignée</p>
                )}
              </div>

              {/* Section Actifs */}
              <div className="detail-card">
                <h2 className="card-title">Actifs</h2>
                {project.assets_actif?.length > 0 ? (
                  <div className="grid-container">
                    {project.assets_actif.map(asset => (
                      <div key={asset._id} className="info-card">
                        <h3>{asset.name}</h3>
                        <div className="info-details">
                          <p><strong>Type:</strong> {asset.type_actif}</p>
                          <p><strong>Valeur:</strong> {asset.total_value}$</p>
                          <p><strong>Date d'acquisition:</strong> {formatDate(asset.date_acquisition)}</p>
                          <p><strong>Type corporel:</strong> {asset.type_corporel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucun actif enregistré</p>
                )}
              </div>
            </section>

            {/* Colonne de droite : Membres de l'équipe */}
            <aside className="team-section">
              <h2 className="section-title">Équipe du Projet</h2>
              <div className="team-list">
                <div className="team-card">
                  <h3 className="team-role">Propriétaire</h3>
                  <p className="team-name">
                    {project.businessOwner?.fullname || 'Non assigné'}
                  </p>
                  <p className="team-email">
                    {project.businessOwner?.email || '-'}
                  </p>
                </div>

                <div className="team-card">
             <h3 className="team-role">Busness Manager</h3>
               <p className="team-name">
                 {project.teamMembers?.manager?.fullname || 'Non assigné'}
               </p>
               <p className="team-email">
                {project.teamMembers?.manager?.email || '-'}
                </p>
                </div>

                
                <div className="team-card">
                  <h3 className="team-role">Comptables</h3>
                  {project.teamMembers?.accountants?.length > 0 ? (
                    project.teamMembers.accountants.map((acc) => (
                      <div key={acc._id} className="team-subitem">
                        <p className="team-name">{acc.fullname}</p>
                        <p className="team-email">{acc.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun comptable assigné</p>
                  )}
                </div>

                <div className="team-card">
                  <h3 className="team-role">Responsables Financiers</h3>
                  {project.teamMembers?.financialManagers?.length > 0 ? (
                    project.teamMembers.financialManagers.map((fm) => (
                      <div key={fm._id} className="team-subitem">
                        <p className="team-name">{fm.fullname}</p>
                        <p className="team-email">{fm.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun responsable financier assigné</p>
                  )}
                </div>

                <div className="team-card">
                  <h3 className="team-role">Responsables RH</h3>
                  {project.teamMembers?.rhManagers?.length > 0 ? (
                    project.teamMembers.rhManagers.map((rh) => (
                      <div key={rh._id} className="team-subitem">
                        <p className="team-name">{rh.fullname}</p>
                        <p className="team-email">{rh.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-members">Aucun responsable RH assigné</p>
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

export default ProjectView;