import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./resetpassword.css"; // Assurez-vous que le fichier CSS est bien importé

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:3000/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage("Mot de passe réinitialisé avec succès !");
      setTimeout(() => {
        navigate("/");  
      }, 2000);
    } else {
      setMessage(data.message || "Erreur lors de la réinitialisation.");
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        
        <h2 className="reset-title">Reset password </h2>
        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              className="reset-input"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-button">Reset</button>
        </form>
        {message && <p className="reset-message">{message}</p>}
        <p className="reset-link" onClick={() => navigate("/login")}>
         Back to Login
        </p>
        <div className="reset-blue-box">
  <img src="/reset-image.png" alt="Reset Password" className="reset-image" />
</div>

      </div>
    </div>
  );
};

export default ResetPassword;
