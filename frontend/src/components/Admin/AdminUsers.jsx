import React, { useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import "./adminuser.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token manquant");
        return;
      }

      const response = await fetch("http://localhost:3000/users/getAllBusinessOwners", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token manquant");
        return;
      }

      const response = await fetch(`http://localhost:3000/users/acceptAutorisation/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ autorization: true }),
      });

      if (response.ok) {
        setUsers(users.map(user => user._id === id ? { ...user, autorization: true } : user));
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation :", error);
    }
  };

  const openEvidence = (evidencePath) => {
    setSelectedEvidence(`http://localhost:3000/${evidencePath.replace('public/', '')}`);
  };

  const closeModal = () => {
    setSelectedEvidence(null);
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <h2>Gestion des Utilisateurs</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Évidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td>{user.fullname} {user.lastname}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.autorization ? (
                        <span className="status approved">✅ Approuvé</span>
                      ) : (
                        <span className="status pending">❌ En attente</span>
                      )}
                    </td>
                    <td>
                      {user.evidence ? (
                        <button onClick={() => openEvidence(user.evidence)} className="view-evidence-btn">
                          Voir l'évidence
                        </button>
                      ) : (
                        "Aucune preuve"
                      )}
                    </td>
                    <td>
                      {!user.autorization && (
                        <button onClick={() => approveUser(user._id)} className="approve-btn">
                          Approuver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Aucun utilisateur trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvidence && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <h3>Évidence de l'utilisateur</h3>
            {selectedEvidence.endsWith(".pdf") ? (
              <iframe src={selectedEvidence} title="Évidence PDF" className="evidence-pdf" />
            ) : (
              <img src={selectedEvidence} alt="Évidence" className="evidence-image" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;