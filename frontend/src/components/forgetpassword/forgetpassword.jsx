import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./forgetpassword.css"; // Utilisation du même CSS mais avec des classes modifiées

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false); // S'il y a un champ de mot de passe
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/users/forgot-password", {
        email: email,
      });
      setMessage(response.data.message);  // Message de succès
      setError("");  // Réinitialisation des erreurs
    } catch (err) {
      setError(err.response?.data.message || "Erreur lors de l'envoi du lien");
      setMessage("");  // Réinitialisation du message
    }
  };

  return (
    <div className="forgot-password-container forgot-password-login-mode">
      <div className="forgot-password-form-box">
        <form onSubmit={handleSubmit} className="forgot-password-sign-in-form">
          <h2>Réinitialisation du Mot de Passe</h2>
          
          <div className="forgot-password-input-field">
            <input
              type="email"
              placeholder="Entrez votre e-mail"
              value={email}
              onChange={handleChange}
              required
            />
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="forgot-password-error-text">{error}</p>}

          <button type="submit" className="forgot-password-btn">
            Envoyer un lien
          </button>

          <p className="forgot-password-switch-text">
            Retour au <span className="forgot-password-toggle-link" onClick={() => navigate("/")}>login</span>
          </p>
        </form>
      </div>

      <div className="forgot-password-blue-box">
        <img
          src="/forgot-password.png" // Image spécifique à la page de réinitialisation
          alt="Forgot Password Illustration"
          className="forgot-password-blue-image"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
