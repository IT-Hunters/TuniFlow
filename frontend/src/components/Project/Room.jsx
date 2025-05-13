import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import GoogleTranslate from '../Project/GoogleTranslate';
import './Room.css';
import '../Project/ProjectView.css';

const API_URL = 'http://localhost:3000/api/rooms';

const Room = () => {
  const { projectId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRooms(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des réunions:', err);
        setError(err.response?.data?.message || 'Échec du chargement des réunions');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [projectId, token, navigate]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const joinRoom = async (roomId) => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const room = rooms.find((r) => r.roomId === roomId);
      if (!room) {
        toast.error('Réunion non trouvée.', {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored'
        });
        return;
      }

      const now = new Date();
      const bufferTime = 5 * 60 * 1000;
      const meetingDate = new Date(room.date);
      if (meetingDate > new Date(now.getTime() + bufferTime)) {
        toast.error(`La réunion n'a pas encore commencé. Veuillez attendre le ${formatDateTime(room.date)}.`, {
          position: 'top-center',
          autoClose: 7000,
          theme: 'colored'
        });
        return;
      }

      const response = await axios.post(
        `${API_URL}/join/${roomId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message, {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored',
        className: 'custom-success-toast'
      });

      const jitsiRoomUrl = `https://meet.jit.si/TuniFlow_${roomId}`;
      window.open(jitsiRoomUrl, '_blank');

      const updatedRooms = await axios.get(`${API_URL}/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(updatedRooms.data);
    } catch (err) {
      console.error('Erreur lors de la tentative de rejoindre la réunion:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la tentative de rejoindre la réunion', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Attempting to leave room:', roomId);

      const response = await axios.post(
        `${API_URL}/leave/${roomId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message, {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored',
        className: 'custom-success-toast'
      });

      const updatedRooms = await axios.get(`${API_URL}/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(updatedRooms.data);
    } catch (err) {
      console.error('Erreur lors de la tentative de quitter la réunion:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la tentative de quitter la réunion', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      return;
    }

    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(`${API_URL}/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(response.data.message, {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored',
        className: 'custom-success-toast'
      });

      const updatedRooms = await axios.get(`${API_URL}/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(updatedRooms.data);
    } catch (err) {
      console.error('Erreur lors de la suppression de la réunion:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression de la réunion', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });
    }
  };

  if (loading) {
    return (
      <div className="state-container loading">
        <div className="spinner"></div>
        <p>Chargement des réunions...</p>
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

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="project-details-wrapper">
          <header className="project-header">
            <GoogleTranslate />
            <h1 className="project-title">Project meetings</h1>
            <div className="action-buttons">
              {/* Vous pouvez ajouter des boutons d'action ici si nécessaire */}
            </div>
          </header>
          <section className="project-details">
            <div className="detail-card">
              <h2 className="card-title">Reunion List</h2>
              {rooms.length === 0 ? (
                <p className="no-data">No meetings found for this project.</p>
              ) : (
                <ul className="room-list">
                  {rooms.map((room) => (
                    <li key={room.roomId} className="room-item">
                      <h3>{room.title || `Réunion ${room.roomId}`}</h3>
                      <p>Date: {formatDateTime(room.date)}</p>
                      <p>Status: <span className={`status ${room.status.toLowerCase()}`}>{room.status}</span></p>
                      <p>Participants: {room.participants.length}</p>
                      <div className="room-actions">
                        <button
                          onClick={() => joinRoom(room.roomId)}
                          className="action-btn join-btn"
                          disabled={room.status === 'ended' || new Date(room.date) > new Date(new Date().getTime() + 5 * 60 * 1000)}
                        >
                          Join
                        </button>
                        <button
                          onClick={() => leaveRoom(room.roomId)}
                          className="action-btn leave-btn"
                          disabled={room.status === 'ended'}
                        >
                          Exit
                        </button>
                        <button
                          onClick={() => deleteRoom(room.roomId)}
                          className="action-btn delete-btn"
                          title="Supprimer la réunion"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Room;