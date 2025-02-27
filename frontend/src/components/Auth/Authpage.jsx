import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "",
    lastname: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/users/forgot-password", {
        email: formData.email,
      });
      setMessage(response.data.message);  // Message de succès
    } catch (err) {
      setError(err.response?.data.message || "Erreur lors de l'envoi du lien");
    }
  };
  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData({
      fullname: "",
      lastname: "",
      email: "",
      password: "",
      confirm: "",
    });
    setError(""); 
    setFile(null);
  };

  useEffect(() => {
    document.body.classList.add("auth-page");

    return () => {
      document.body.classList.remove("auth-page");
    };
  }, []);

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

    if (!isLogin && formData.password !== formData.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      if (isLogin) {
        const response = await axios.post("http://localhost:3000/users/login", { 
          email: formData.email, 
          password: formData.password 
        });

        const { token, role } = response.data;
        localStorage.setItem("token", token);
        navigate(role === "ADMIN" ? "/dashboard" : "/profile");
        
        setError("");
      } else {
        // Utilisation de FormData pour l'inscription
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

        const response = await axios.post("http://localhost:3000/users/register", formDataToSend, {
         
        });


        setIsLogin(true);
        setError("");
      }
    } catch (err) {
      if (err.response?.data) {
        setError(Object.values(err.response.data)[0]); // Afficher la première erreur
      } else {
        setError("Une erreur s'est produite.");
      }
    }
  };

  return (
    <div className={`auth-container ${isLogin ? "auth-login-mode" : ""}`}>
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
            
            <button className="auth-btn" type="submit">
              Log In
            </button>
             <p className="auth-switch-text">
      Forget Your  Password ?{" "}
      <span className="auth-toggle-link" onClick={() => navigate("/forgot-password")}>
        Click here
      </span>
    </p>
            
            <p className="auth-switch-text">
              Don’t have an account?{" "}
              <span className="auth-toggle-link" onClick={toggleMode}>
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

         {/* Champ d'upload de fichier avec un bouton stylisé */}
<div className="auth-input-field">
{/* Champ d'upload de fichier avec un bouton stylisé */}
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
  
</div>

            {error && <p className="auth-error-text">{error}</p>}

            <button className="auth-btn" type="submit">
              Sign Up
            </button>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <span className="auth-toggle-link" onClick={toggleMode}>
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
