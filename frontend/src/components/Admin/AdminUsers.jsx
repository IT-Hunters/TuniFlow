import React, { useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import "./adminuser.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isPDF, setIsPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // État pour la recherche
  const [filteredUsers, setFilteredUsers] = useState([]); // État pour les utilisateurs filtrés

  // Fonction pour récupérer la liste des utilisateurs
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }

      const data = await response.json();
      const usersList = Array.isArray(data) ? data : [];
      setUsers(usersList);
      setFilteredUsers(usersList); // Initialiser la liste filtrée
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtre les utilisateurs en fonction du terme de recherche
  useEffect(() => {
    const results = users.filter(user => {
      const fullName = `${user.fullname} ${user.lastname}`.toLowerCase();
      const email = user.email.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
    
    setFilteredUsers(results);
  }, [searchTerm, users]);

  // Fonction pour approuver un utilisateur
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
          Authorization: `Bearer ${token}`,
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

  // Ouvrir la modal pour afficher la preuve (PDF ou image)
  const openEvidence = (evidencePath) => {
    const fileUrl = `http://localhost:3000/${evidencePath.replace("public/", "")}`;
    setSelectedEvidence(fileUrl);
    setIsPDF(fileUrl.endsWith(".pdf"));
  };

  // Fermer la modal
  const closeModal = () => {
    setSelectedEvidence(null);
    setIsPDF(false);
  };

  // Télécharger l'évidence
  const downloadEvidence = (evidencePath) => {
    const fileUrl = `http://localhost:3000/${evidencePath.replace("public/", "")}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop(); // Nom du fichier
    link.click();
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <div className="table-header">
            <h2>Gestion des Utilisateurs</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <div className="table-container">
            <table className="users-table">
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
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
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
                          <div className="evidence-buttons">
                            <button onClick={() => openEvidence(user.evidence)} className="view-evidence-btn">
                              <i className="fa fa-eye"></i> Voir
                            </button>
                            <button onClick={() => downloadEvidence(user.evidence)} className="download-evidence-btn">
                              <i className="fa fa-download"></i> Télécharger
                            </button>
                          </div>
                        ) : (
                          <span className="no-evidence">Aucune preuve</span>
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
                  <tr className="no-results">
                    <td colSpan="6">
                      {searchTerm ? "Aucun utilisateur ne correspond à la recherche" : "Aucun utilisateur trouvé"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal pour afficher l'évidence */}
      {selectedEvidence && (
        <div className="modal">
          <div className={`modal-content ${isPDF ? "pdf-modal" : ""}`}>
            <span className="close" onClick={closeModal}>&times;</span>
            <h3>Évidence de l'utilisateur</h3>
            {isPDF ? (
              <iframe
                src={selectedEvidence}
                title="Évidence PDF"
                className="evidence-pdf"
                width="100%"
                height="100%"
              />
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