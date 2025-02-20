import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "./AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  useEffect(() => {
    // Add the 'auth-page' class to the body when this component is rendered
    document.body.classList.add('auth-page');

    // Clean up: remove the 'auth-page' class when the component unmounts
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className={`auth-container ${isLogin ? "auth-login-mode" : ""}`}>
      {/* LEFT BOX: Holds both Sign Up and Log In forms */}
      <div className="auth-form-box">
        {/* SIGN UP FORM */}
        <form className="auth-sign-up-form">
          <h2>Create an Account</h2>
          <div className="auth-input-field">
            <input type="text" placeholder="First Name" />
          </div>
          <div className="auth-input-field">
            <input type="text" placeholder="Last Name" />
          </div>
          <div className="auth-input-field">
            <input type="email" placeholder="Email" />
          </div>

          {/* PASSWORD INPUT WITH EYE ICON */}
          <div className="auth-input-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
            />
            <span
              className="auth-eye-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

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

        {/* LOG IN FORM */}
        <form className="auth-sign-in-form">
          <h2>Log In</h2>
          <div className="auth-input-field">
            <input type="email" placeholder="Email" />
          </div>

          {/* PASSWORD INPUT WITH EYE ICON */}
          <div className="auth-input-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <span
              className="auth-eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

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
