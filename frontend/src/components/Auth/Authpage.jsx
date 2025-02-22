import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    lastname: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();

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
  };

  useEffect(() => {
    document.body.classList.add('auth-page');

    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
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
    navigate(role === "admin" ? "/dashboard" : "/profile");
    alert("Connexion réussie !");
    setError("");
  } else {
    const response = await axios.post("http://localhost:3000/users/register", { 
      fullname: formData.fullname,
      lastname: formData.lastname,
      email: formData.email,
      password: formData.password,
      confirm: formData.confirm,
      role: "BUSINESS_OWNER",
    });

    alert("Inscription réussie !");
    setIsLogin(true);
    setError("");
  }
} catch (err) {
  if (err.response?.data) {
    // Si l'erreur est sous forme d'objet avec des clés
    const errorMessage = Object.values(err.response.data).join("\n");
    setError(errorMessage);
  } else {
    setError("Une erreur s'est produite.");
  }
}
};

  return (
    <div className={`auth-container ${isLogin ? "auth-login-mode" : ""}`}>
      {/* LEFT BOX: Holds both Sign Up and Log In forms */}
      <div className="auth-form-box">
        {/* SWITCH BETWEEN LOGIN AND SIGN UP FORM */}
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
                required
              />
            </div>

            {/* PASSWORD INPUT WITH EYE ICON */}
            <div className="auth-input-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className="auth-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Affichage de l'erreur sous le champ email */}
      {error && <p className="auth-error-text">{error}</p>}
            
            <button className="auth-btn" type="submit">
              Log In
            </button>
            
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

            {/* PASSWORD INPUT WITH EYE ICON */}
            <div className="auth-input-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span
                className="auth-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* CONFIRM PASSWORD INPUT */}
            <div className="auth-input-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
              />
              <span
                className="auth-eye-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
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

      {/* RIGHT BOX: Blue container with an image */}
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
