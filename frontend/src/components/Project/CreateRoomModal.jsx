import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CreateRoomModal.css';

const API_URL = 'http://localhost:3000/api/rooms';

const CreateRoomModal = ({ projectId, isOpen, onClose, onRoomCreated }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Valider que la date est dans le futur
    const now = new Date();
    const selectedDate = new Date(date);
    if (selectedDate <= now) {
      setError('La date de la réunion doit être dans le futur.');
      return;
    }

    try {
      const response = await axios.post(
        API_URL,
        { projectId, title, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Réunion créée avec succès !', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored'
      });

      onRoomCreated(response.data.roomId);
      onClose();
      setTitle('');
      setDate('');
    } catch (err) {
      console.error('Erreur lors de la création de la réunion:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la réunion');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Créer une nouvelle réunion</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titre de la réunion</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date et heure</label>
            <input
              type="datetime-local"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)} // Restreindre aux dates futures
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuler
            </button>
            <button type="submit" className="submit-btn">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;