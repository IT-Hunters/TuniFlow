import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './UserUpdate.css'; // Créez ce fichier CSS pour le style

const API_URL = 'http://localhost:3000/users';

const UserUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    lastname: '',
    email: ''
  });

  // Récupérer les données du manager à éditer
  useEffect(() => {
    const fetchManager = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/getbyid/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          fullname: response.data.fullname,
          lastname: response.data.lastname,
          email: response.data.email
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch manager data');
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/updatebyid/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Rediriger vers la liste avec un message de succès
      // Dans la fonction handleSubmit de UserUpdate.jsx
navigate('/ManagerList', { state: { successMessage: 'Manager updated successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update manager');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="update-container">
      <h2>Edit Manager</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="update-form">
        <div className="form-group">
          <label htmlFor="fullname">First Name</label>
          <input
            type="text"
            id="fullname"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/ManagerList')} className="btn cancel">
            Cancel
          </button>
          <button type="submit" className="btn submit">
            Update Manager
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserUpdate;