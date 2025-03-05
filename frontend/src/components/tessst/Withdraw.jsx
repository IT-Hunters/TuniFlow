import React from "react";
import CoolSidebar from "../sidebarHome/newSidebar"; // Assurez-vous que le chemin est correct
import Navbar from "../navbarHome/NavbarHome";
import "./Tessst.css";

const Withdraw = ({ goBack }) => {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <CoolSidebar />

      {/* Contenu principal */}
      <div className="main-content">
        {/* Navbar */}
        <Navbar />

        <div className="wallet-container">
          <div className="wallet-header">
            <h2>Retrait</h2>
            <button className="back-button" onClick={goBack}>
              Retour
            </button>
          </div>

          <div className="form-container">
            <label>
              Montant :
              <input type="number" placeholder="Entrez le montant" />
            </label>
            <button className="submit-button">Retirer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
