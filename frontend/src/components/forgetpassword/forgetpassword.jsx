// src/components/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
//import axios from "axios";
import axios from '@/axios'
import "./forgetpassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await axios.post("/users/forgot-password", {
        email: email,
      });
      setMessage(response.data.message);
      setError("");
    } catch (err) {
      setError(err.response?.data.message || "Error during sending link");
      setMessage("");
    } finally {
      console.log("Starting 1-second delay for forgot password...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("1-second delay completed for forgot password.");
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {loading && (
        <div className="forgot-password-loading-overlay">
          <div className="forgot-password-loading-spinner"></div>
          <p>Please wait...</p>
        </div>
      )}

      <div className="forgot-password-container">
        <div className="forgot-password-blue-box">
          <img
            src="/forgot-password.png"
            alt="Forgot Password Illustration"
            className="forgot-password-blue-image"
          />
        </div>

        <div className="forgot-password-form-box">
          <form onSubmit={handleSubmit} className="forgot-password-sign-in-form">
            <h2>Reset Password</h2>
            <div className="forgot-password-input-field">
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="forgot-password-error-text">{error}</p>}

            <button type="submit" className="forgot-password-btn">
              Send
            </button>

            <p className="forgot-password-switch-text">
              Back to{" "}
              <span className="forgot-password-toggle-link" onClick={() => navigate("/")}>
                login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;