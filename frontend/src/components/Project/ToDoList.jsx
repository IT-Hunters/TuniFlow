import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPen, FaTrash } from 'react-icons/fa';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './ToDoList.css';

const ToDoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem('token');

  // Charger les tâches de l'utilisateur connecté
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:3000/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches:', err);
        setError('Échec du chargement des tâches');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchTasks();
  }, [token]);

  // Ajouter une nouvelle tâche
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) {
      setError('La description de la tâche ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        'http://localhost:3000/api/tasks',
        { description: newTask, status: 'À faire' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, response.data]);
      setNewTask('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la tâche:', err);
      setError('Échec de l\'ajout de la tâche');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour l'état d'une tâche
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task));
      toast.success('État de la tâche mis à jour', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche:', err);
      toast.error('Échec de la mise à jour de la tâche', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    }
  };

  // Modifier une tâche (description)
  const handleEditTask = (task) => {
    setEditingTask(task._id);
    setEditedDescription(task.description);
  };

  const handleSaveEdit = async (taskId) => {
    if (!editedDescription.trim()) {
      toast.error('La description ne peut pas être vide', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:3000/api/tasks/${taskId}`,
        { description: editedDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => task._id === taskId ? { ...task, description: editedDescription } : task));
      setEditingTask(null);
      setEditedDescription('');
      toast.success('Tâche modifiée avec succès', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    } catch (err) {
      console.error('Erreur lors de la modification de la tâche:', err);
      toast.error('Échec de la modification de la tâche', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:3000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter(task => task._id !== taskId));
      toast.success('Tâche supprimée avec succès', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche:', err);
      toast.error('Échec de la suppression de la tâche', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    }
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="update-project-wrapper">
          <header className="project-header">
            <h1 className="project-title">Ma Liste de Tâches</h1>
          </header>

          <section className="update-form">
            <div className="detail-card">
              <h2 className="card-title">Gestion des Tâches</h2>

              {success && (
                <div className="alert alert-success">
                  Tâche ajoutée avec succès.
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddTask} className="project-form" noValidate>
                <div className="form-group">
                  <label htmlFor="newTask" className="label">Nouvelle Tâche *</label>
                  <input
                    type="text"
                    id="newTask"
                    name="newTask"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="form-input"
                    placeholder="Entrez une tâche..."
                    required
                  />
                  <button 
                    type="submit" 
                    className="action-btn submit-btn" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span> Ajout...
                      </>
                    ) : 'Ajouter Tâche'}
                  </button>
                </div>
              </form>

              {tasks.length > 0 ? (
                <div className="task-list">
                  {tasks.map((task) => (
                    <div key={task._id} className="task-item">
                      {editingTask === task._id ? (
                        <input
                          type="text"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          onBlur={() => handleSaveEdit(task._id)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(task._id)}
                          className="task-description-input form-input"
                          autoFocus
                        />
                      ) : (
                        <p className="task-description">{task.description}</p>
                      )}
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                        className="task-status form-input"
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="Complétée">Complétée</option>
                      </select>
                      <div className="task-actions">
                        <button onClick={() => handleEditTask(task)} className="action-btn edit-btn">
                          <FaPen />
                        </button>
                        <button onClick={() => handleDeleteTask(task._id)} className="action-btn delete-btn">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">Aucune tâche pour le moment</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ToDoList;