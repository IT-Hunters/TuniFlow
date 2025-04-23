import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CoolSidebar from '../sidebarHome/newSidebar';
import Navbar from '../navbarHome/NavbarHome';
import './EmpoyeeTable.css'; // Crée ce fichier ou copie depuis UpdateProject.css

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:3000/users/getempl');
        setEmployees(response.data);
      } catch (err) {
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="container">
      <CoolSidebar />
      <div className="main">
        <Navbar />
        <div className="employee-table-wrapper">
          <header className="employee-table-header">
            <h1 className="employee-table-title">Liste des Employés</h1>
          </header>

          {loading ? (
            <div className="state-container loading">
              <div className="spinner"></div>
              <p>Chargement des employés...</p>
            </div>
          ) : error ? (
            <div className="state-container error">
              <p>{error}</p>
              <button className="action-btn retry-btn" onClick={() => window.location.reload()}>
                Réessayer
              </button>
            </div>
          ) : (
            <section className="employee-table-section">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;
