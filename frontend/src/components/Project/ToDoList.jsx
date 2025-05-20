import React, { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from '@/axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPen, FaTrash, FaArchive, FaUndo } from 'react-icons/fa';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './ToDoList.css';

const ToDoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState(''); // État pour la date d'échéance
  const [editingTask, setEditingTask] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // État pour basculer entre tâches actives et archivées
  const token = localStorage.getItem('token');

  // Charger les tâches de l'utilisateur connecté
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
          params: { showArchived },
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
  }, [token, showArchived]);

  // Calculer les pourcentages pour la barre de progression
  const getProgressStats = () => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return { todo: 0, inProgress: 0, completed: 0 };

    const todo = (tasks.filter(task => task.status === 'À faire').length / totalTasks) * 100;
    const inProgress = (tasks.filter(task => task.status === 'En cours').length / totalTasks) * 100;
    const completed = (tasks.filter(task => task.status === 'Complétée').length / totalTasks) * 100;

    return { todo, inProgress, completed };
  };

  const progressStats = getProgressStats();

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
        '/api/tasks',
        { description: newTask, status: 'À faire', dueDate: newDueDate || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, response.data]);
      setNewTask('');
      setNewDueDate('');
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
        `/api/tasks/${taskId}`,
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

  // Modifier une tâche (description ou dueDate)
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
        `/api/tasks/${taskId}`,
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

  // Archiver ou désarchiver une tâche
  const handleArchiveTask = async (taskId, isArchived) => {
    try {
      await axios.put(
        `/api/tasks/${taskId}/archive`,
        { isArchived },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.filter(task => task._id !== taskId)); // Retirer la tâche de la vue actuelle
      toast.success(isArchived ? 'Tâche archivée avec succès' : 'Tâche restaurée avec succès', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    } catch (err) {
      console.error('Erreur lors de l\'archivage de la tâche:', err);
      toast.error('Échec de l\'archivage de la tâche', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
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

  // Déterminer la classe CSS pour la couleur d'urgence
  const getDueDateClass = (dueDate) => {
    if (!dueDate) return '';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue'; // Rouge si dépassée
    if (diffDays <= 3) return 'approaching'; // Orange si dans 3 jours ou moins
    return '';
  };

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="update-project-wrapper">
          <header className="project-header">
            <h1 className="project-title">My Tasks List</h1>
            <button
              className="action-btn toggle-archive-btn"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Voir Active Task' : 'Voir Archived Task'}
            </button>
          </header>

          <section className="update-form">
            <div className="detail-card">
              <h2 className="card-title">{showArchived ? 'Tâches Archivées' : 'Tasks Management '}</h2>

              {!showArchived && (
                <>
                  {/* Barre de progression */}
                  <div className="progress-container">
                    <div className="progress-labels">
                      <span>À faire: {progressStats.todo.toFixed(1)}%</span>
                      <span>En cours: {progressStats.inProgress.toFixed(1)}%</span>
                      <span>Complétée: {progressStats.completed.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-todo" style={{ width: `${progressStats.todo}%` }}></div>
                      <div className="progress-in-progress" style={{ width: `${progressStats.inProgress}%` }}></div>
                      <div className="progress-completed" style={{ width: `${progressStats.completed}%` }}></div>
                    </div>
                  </div>

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
                      <label htmlFor="newTask" className="label">New Task *</label>
                      <input
                        type="text"
                        id="newTask"
                        name="newTask"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="form-input"
                        placeholder="Enter a task..."
                        required
                      />
                      <label htmlFor="newDueDate" className="label">Due Date (facultatif)</label>
                      <input
                        type="date"
                        id="newDueDate"
                        name="newDueDate"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="form-input"
                      />
                      <button 
                        type="submit" 
                        className="action-btn submit-btn" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner"></span> Add...
                          </>
                        ) : 'Ajouter Tâche'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {tasks.length > 0 ? (
                <div className="task-list">
                  {tasks.map((task) => (
                    <div key={task._id} className={`task-item ${getDueDateClass(task.dueDate)}`}>
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
                        <div className="task-details">
                          <p className="task-description">{task.description}</p>
                          {task.dueDate && (
                            <p className="task-due-date">
                              Échéance: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                        className="task-status form-input"
                        disabled={showArchived}
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="Complétée">Complétée</option>
                      </select>
                      <div className="task-actions">
                        {!showArchived && (
                          <>
                            <button onClick={() => handleEditTask(task)} className="action-btn edit-btn">
                              <FaPen />
                            </button>
                            <button onClick={() => handleArchiveTask(task._id, true)} className="action-btn archive-btn">
                              <FaArchive />
                            </button>
                          </>
                        )}
                        {showArchived && (
                          <button onClick={() => handleArchiveTask(task._id, false)} className="action-btn restore-btn">
                            <FaUndo />
                          </button>
                        )}
                        <button onClick={() => handleDeleteTask(task._id)} className="action-btn delete-btn">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">{showArchived ? 'Aucune tâche archivée' : 'Aucune tâche pour le moment'}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ToDoList;