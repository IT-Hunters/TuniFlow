import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddEmployee.css'; // Créez ce fichier CSS pour le style

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' // Valeur par défaut
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(
        'http://localhost:3000/users/addemployee',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      // Réinitialiser le formulaire après succès
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee'
      });
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/projectview');
      }, 2000);
      
    } catch (err) {
      console.error('Error adding employee:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-employee-container">
      <h2>Add New Epmoye</h2>
      
      {success && (
        <div className="alert alert-success">
          Employé added successfuly
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="employee-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
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

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="role">ROle</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="employee">Employe</option>
            
          </select>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'En cours...' : 'ADD Employe'}
        </button>
      </form>
    </div>
  );
};

export default AddEmployee;