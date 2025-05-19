// src/components/AuthPage.jsx
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
//import axios from "axios";
import axios from '@/axios'
import "./Authpage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    lastname: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:3000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const { role } = response.data;
          if (role === "ADMIN") {
            navigate("/dashboard");
          } else {
            navigate("/user");
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
        });
    }
  }, [navigate]);

  useEffect(() => {
    document.body.classList.add("auth-page");

    return () => {
      document.body.classList.remove("auth-page");
    };
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await axios.post("http://localhost:3000/users/forgot-password", {
        email: formData.email,
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data.message || "Erreur lors de l'envoi du lien");
    } finally {
      console.log("Starting 1-second delay for forgot password...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconde fixe
      console.log("1-second delay completed for forgot password.");
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData({
      fullname: "",
      lastname: "",
      email: "",
      password: "",
      confirm: "",
    });
    setError("");
    setMessage("");
    setFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!isLogin && formData.password !== formData.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      console.log("Password mismatch, waiting 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconde fixe
      setLoading(false);
      return;
    }

    let redirectPath = null;

    try {
      if (isLogin) {
        const response = await axios.post("/users/login", {
          email: formData.email,
          password: formData.password,
        });

        const { token, role,userId } = response.data;
        localStorage.setItem("userId", userId);
        localStorage.setItem("role", role);
        localStorage.setItem("token", token);
        redirectPath = role === "ADMIN" ? "/dashboard" : "/user";
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append("fullname", formData.fullname);
        formDataToSend.append("lastname", formData.lastname);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("confirm", formData.confirm);
        formDataToSend.append("role", "BUSINESS_OWNER");

        if (file) {
          formDataToSend.append("evidence", file);
        }

        const response = await axios.post("/users/register", formDataToSend);

        setIsLogin(true);
        setMessage("Registration successful! Please log in.");
      }

      // Attendre 1 seconde fixe
      console.log("Starting 1-second delay for submit...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconde fixe
      console.log("1-second delay completed for submit.");

      // Rediriger après le délai
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (err) {
      if (err.response?.data) {
        setError(Object.values(err.response.data)[0]);
      } else {
        setError("Une erreur s'est produite.");
      }

      // Attendre 1 seconde fixe même en cas d'erreur
      console.log("Error occurred, waiting 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconde fixe
      console.log("1-second delay completed after error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isLogin ? "auth-login-mode" : ""}`}>
      {loading && (
        <div className="auth-loading-overlay">
          <div className="auth-loading-spinner"></div>
          <p>Please wait...</p>
        </div>
      )}
      <div className="auth-form-box">
        {isLogin ? (
          <form onSubmit={handleSubmit} className="auth-sign-in-form">
            <h2>Log In</h2>
            <div className="auth-input-field">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="auth-input-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="auth-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {error && <p className="auth-error-text">{error}</p>}
            {message && <p className="auth-success-text">{message}</p>}

            <button className="auth-btn" type="submit">
              Log In
            </button>
            <p className="auth-switch-text">
              Forget Your Password?{" "}
              <span className="auth-toggle-link" onClick={() => navigate("/forgot-password")}>
                Click here
              </span>
            </p>

            <p className="auth-switch-text">
              Don’t have an account?{" "}
              <span className="auth-toggle-link" onClick={handleToggleMode}>
                Sign Up
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-sign-up-form">
            <h2>Create an Account</h2>
            <div className="auth-input-field">
              <input
                type="text"
                placeholder="First Name"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
              />
            </div>
            <div className="auth-input-field">
              <input
                type="text"
                placeholder="Last Name"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
              />
            </div>
            <div className="auth-input-field">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="auth-input-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="auth-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="auth-input-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
              />
              <span className="auth-eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="auth-input-field">
              <input
                type="file"
                id="file-upload"
                className="auth-file-input"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="auth-file-label">
                Prove Your Company 📂
              </label>
              {file && <p className="auth-file-name">{file.name}</p>}
            </div>

            {error && <p className="auth-error-text">{error}</p>}
            {message && <p className="auth-success-text">{message}</p>}

            <button className="auth-btn" type="submit">
              Sign Up
            </button>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <span className="auth-toggle-link" onClick={handleToggleMode}>
                Log In
              </span>
            </p>
          </form>
        )}
      </div>

      <div className="auth-blue-box">
        <img
          src={isLogin ? "/calculator.png" : "/signup.png"}
          alt="Auth Illustration"
          className="auth-blue-image image"
        />
      </div>
    </div>
  );
};

export default AuthPage;