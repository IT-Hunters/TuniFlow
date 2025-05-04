import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './ProjectView.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import GoogleTranslate from './GoogleTranslate';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// Fonction pour valider un email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const ProjectView = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '' });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const decodedToken = token ? decodeJWT(token) : null;
  const userRole = decodedToken?.role;
  const userId = decodedToken?.userId;
  const userEmail = decodedToken?.email || 'Utilisateur'; // Récupérer l'email ou un identifiant par défaut

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

        console.log('Structure complète de project:', response.data);
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
      toast.error("Impossible de générer le rapport : ID du projet manquant", {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });
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
      toast.error(
        `Erreur lors de la génération du rapport: ${err.response?.data?.message || err.message}`,
        {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored'
        }
      );
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

      toast.success(`Succès: ${response.data.message}`, {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });

      const projectResponse = await axios.get(`${API_URL}/findMyProject`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(projectResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(
        `Erreur: ${error.response?.data?.message || 'Erreur lors de l\'upload du fichier Excel.'}`,
        {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored'
        }
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createRoom = async () => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      if (!formData.title || !formData.date) {
        toast.error('Veuillez remplir tous les champs du formulaire.', {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored',
        });
        return;
      }

      const now = new Date();
      const selectedDate = new Date(formData.date);
      if (selectedDate <= now) {
        toast.error('La date de la réunion doit être dans le futur.', {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored',
        });
        return;
      }

      // Créer la réunion dans le backend
      const roomResponse = await axios.post(
        'http://localhost:3000/api/rooms',
        { projectId: project.id, title: formData.title, date: formData.date },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Récupérer les emails en utilisant la structure project.teamMembers
      const businessManagerEmail = project.teamMembers?.manager?.email;
      const accountantsEmails = (project.teamMembers?.accountants || []).map(acc => acc.email);
      const financialManagersEmails = (project.teamMembers?.financialManagers || []).map(fm => fm.email);
      const rhManagersEmails = (project.teamMembers?.rhManagers || []).map(rh => rh.email);
      const businessOwnerEmail = project.businessOwner?.email;

      // Log pour afficher les emails par rôle
      console.log('Emails extraits par rôle:', {
        businessManagerEmail,
        accountantsEmails,
        financialManagersEmails,
        rhManagersEmails,
        businessOwnerEmail
      });

      const attendeeEmails = [
        businessManagerEmail,
        ...accountantsEmails,
        ...financialManagersEmails,
        ...rhManagersEmails,
        businessOwnerEmail,
      ].filter(email => email && isValidEmail(email)); // Filtrer les valeurs null/undefined et les emails invalides

      const allAttendeeEmails = [...new Set(attendeeEmails)]; // Éviter les doublons

      console.log('Emails des participants avant envoi:', allAttendeeEmails);

      // Créer un événement Google Calendar
      const calendarEvent = {
        summary: formData.title,
        description: `Réunion pour le projet ${project.name || project.id}.`,
        start: {
          dateTime: selectedDate.toISOString(),
          timeZone: 'Africa/Tunis',
        },
        end: {
          dateTime: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Africa/Tunis',
        },
        attendees: allAttendeeEmails.length > 0 ? allAttendeeEmails.map(email => ({ email })) : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      console.log('Requête envoyée à Google Calendar:', { calendarId: 'primary', event: calendarEvent, sendNotifications: true });

      // Appeler la route backend pour créer l'événement
      const calendarResponse = await axios.post(
        'http://localhost:3000/api/calendar/create-event',
        {
          calendarId: 'primary',
          event: calendarEvent,
          sendNotifications: allAttendeeEmails.length > 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Réponse complète de Google Calendar:', calendarResponse.data);

      // Vérifier si l'événement a été créé avec succès
      if (calendarResponse.data.event && calendarResponse.data.event.id) {
        console.log('Événement créé avec succès, ID:', calendarResponse.data.event.id);
        // Vérifier les participants dans la réponse
        if (calendarResponse.data.event.attendees) {
          console.log('Participants confirmés dans l\'événement:', calendarResponse.data.event.attendees.map(att => att.email));
        } else {
          console.log('Aucun participant confirmé dans la réponse de l\'événement.');
        }

        // Notification pour l'utilisateur connecté (en bas à droite)
        toast.info(
          `Événement "${formData.title}" ajouté à votre Google Calendar, ${userEmail} !`,
          {
            position: 'bottom-right',
            autoClose: 5000,
            theme: 'colored',
          }
        );
      } else {
        console.log('Aucune ID d\'événement retournée, vérifiez la réponse:', calendarResponse.data);
      }

      // Afficher une notification de succès avec les participants
      toast.success(
        `${roomResponse.data.message} `,
        {
          position: 'top-center',
          autoClose: 7000,
          className: 'custom-success-toast',
        }
      );

      setIsModalOpen(false);
      setFormData({ title: '', date: '' });
      navigate(`/rooms/${project.id}`);
    } catch (err) {
      console.error('Erreur détaillée lors de la création de la réunion:', err.response ? err.response.data : err.message);
      toast.error(
        err.response?.data?.message || 'Erreur lors de la création de la réunion (Vérifiez votre authentification)',
        {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored',
        }
      );
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
            <GoogleTranslate />
            <h1 className="project-title">
              {project.name || `Projet ${project.id?.slice(-4) || 'Sans nom'}`}
            </h1>
            <div className="action-buttons">
              {userRole === 'RH' && (
                <>
                  <button 
                    onClick={() => navigate('/add-employee')} 
                    className="action-btn add-employee-btn"
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
              <button 
                onClick={() => navigate('/findemploye')} 
                className="action-btn show-employees-btn"
                style={{ backgroundColor: '#2196F3', color: 'white' }}
              >
                Voir Employés
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="action-btn create-room-btn"
                style={{ backgroundColor: '#9c27b0', color: 'white' }}
              >
                Créer Réunion
              </button>
              <Link 
                to={`/rooms/${project.id}`} 
                className="action-btn view-rooms-btn"
                style={{ backgroundColor: '#3f51b5', color: 'white' }}
              >
                Voir toutes les réunions
              </Link>
            </div>
          </header>

          {isModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <h2>Créer une nouvelle réunion</h2>
                <form onSubmit={(e) => { e.preventDefault(); createRoom(); }}>
                  <div className="form-group">
                    <label htmlFor="title">Titre de la réunion</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="date">Date et heure</label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormData({ title: '', date: '' });
                      }}
                      className="action-btn cancel-btn"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="action-btn submit-btn"
                    >
                      Créer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="project-layout">
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

              <div className="detail-card">
                <h2 className="card-title">Objectifs</h2>
                {project.objectifs?.length > 0 ? (
                  <div className="objectifs-container">
                    {project.objectifs.map((objectif) => (
                      <div key={objectif._id} className="objectif-card">
                        <div className="objectif-header">
                          <h3>{objectif.name}</h3>
                          <span>Statut: </span>
                          <span className={`status-badge ${objectif.status.toLowerCase()}`}>
                            {objectif.status}
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
                          <span>Progrès: </span>
                          <span className="progress-text">{objectif.progress}%</span>
                        </div>
                        <div className="objectif-details">
                          <div className="detail-row">
                            <span>Montant cible: </span>
                            <strong>{objectif.target_amount.toLocaleString()} $</strong>
                          </div>
                          <div className="detail-row">
                            <span>Budget: </span>
                            <strong>
                              {objectif.minbudget.toLocaleString()} $ - {objectif.maxbudget.toLocaleString()} $
                            </strong>
                          </div>
                          <div className="detail-row">
                            <span>Période: </span>
                            <strong>
                              {formatDate(objectif.datedebut)} au {formatDate(objectif.datefin)}
                            </strong>
                          </div>
                          <div className="detail-row">
                            <span>Type: </span>
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

              <div className="detail-card">
                <h2 className="card-title">Taxes</h2>
                {project.taxes?.length > 0 ? (
                  <div className="grid-container">
                    {project.taxes.map((tax) => (
                      <div key={tax._id} className="info-card">
                        <h3>{tax.nom_taxe}</h3>
                        <div className="info-details">
                          <p><strong>Catégorie: </strong> {tax.categorie}</p>
                          <p><strong>Taux: </strong> {tax.taux}%</p>
                          <p><strong>Date d'effet: </strong> {formatDate(tax.date_effet)}</p>
                          <p><strong>Description: </strong> {tax.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucune taxe assignée</p>
                )}
              </div>

              <div className="detail-card">
                <h2 className="card-title">Actifs</h2>
                {project.assets_actif?.length > 0 ? (
                  <div className="grid-container">
                    {project.assets_actif.map((asset) => (
                      <div key={asset._id} className="info-card">
                        <h3>{asset.name}</h3>
                        <div className="info-details">
                          <p><strong>Type: </strong> {asset.type_actif}</p>
                          <p><strong>Valeur: </strong> {asset.total_value}$</p>
                          <p><strong>Date d'acquisition: </strong> {formatDate(asset.date_acquisition)}</p>
                          <p><strong>Type corporel: </strong> {asset.type_corporel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucun actif enregistré</p>
                )}
              </div>
            </section>

            <aside className="team-section">
              <h2 className="section-title">Membres de l'équipe</h2>
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
                  <h3 className="team-role">Manager Commercial</h3>
                  <p className="team-name">
                    {project.teamMembers?.manager?.fullname || 'Non assigné'}
                  </p>
                  <p className="team-email">
                    {project.teamMembers?.manager?.email || '-'}
                  </p>
                </div>

                <div className="team-card">
                  <h3 className="team-role">Comptable</h3>
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