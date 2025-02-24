import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./forgetpassword.css"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
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
      setMessage(response.data.message);  
      setError(""); 
    } catch (err) {
      setError(err.response?.data.message || "Erreur lors de l'envoi du lien");
      setMessage("");  
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
          src="/forgot-password.png" 
          alt="Forgot Password Illustration"
          className="forgot-password-blue-image"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
