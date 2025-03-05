import React from "react";
import CoolSidebar from "../sidebarHome/newSidebar"; // Assurez-vous que le chemin est correct
import Navbar from "../navbarHome/NavbarHome"; // Assurez-vous que le chemin est correct
import "./Tessst.css"; // Assurez-vous que le fichier CSS est correct

const Deposit = ({ goBack }) => {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <CoolSidebar />

      {/* Contenu principal */}
      <div className="main-content">
        {/* Navbar */}
        <Navbar />

        {/* Contenu du dépôt */}
        <div className="wallet-container">
          <div className="wallet-header">
            <h2>Dépôt</h2>
            <button className="back-button" onClick={goBack}>
              Retour
            </button>
          </div>

          <div className="form-container">
            <label>
              Montant :
              <input type="number" placeholder="Entrez le montant" />
            </label>
            <button className="submit-button">Déposer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;