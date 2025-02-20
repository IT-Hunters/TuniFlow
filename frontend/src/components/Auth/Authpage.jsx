import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "./AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <div className={`auth-container ${isLogin ? "login-mode" : ""}`}>
      {/* LEFT BOX: Holds both Sign Up and Log In forms */}
      <div className="form-box">
        {/* SIGN UP FORM */}
        <form className="sign-up-form">
          <h2>Create an Account</h2>
          <div className="input-field">
            <input type="text" placeholder="First Name" />
          </div>
          <div className="input-field">
            <input type="text" placeholder="Last Name" />
          </div>
          <div className="input-field">
            <input type="email" placeholder="Email" />
          </div>

          {/* PASSWORD INPUT WITH EYE ICON */}
          <div className="input-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* CONFIRM PASSWORD INPUT */}
          <div className="input-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="btn" type="submit">
            Sign Up
          </button>
          <p className="switch-text">
            Already have an account?{" "}
            <span className="toggle-link" onClick={toggleMode}>
              Log In
            </span>
          </p>
        </form>

        {/* LOG IN FORM */}
        <form className="sign-in-form">
          <h2>Log In</h2>
          <div className="input-field">
            <input type="email" placeholder="Email" />
          </div>

          {/* PASSWORD INPUT WITH EYE ICON */}
          <div className="input-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="btn" type="submit">
            Log In
          </button>
          <p className="switch-text">
            Don’t have an account?{" "}
            <span className="toggle-link" onClick={toggleMode}>
              Sign Up
            </span>
          </p>
        </form>
      </div>

      {/* RIGHT BOX: Blue container with an image */}
      <div className="blue-box">
  <img
    src={isLogin ? "/calculator.png" : "/signup.png"}
    alt="Auth Illustration"
    className="blue-image image"
  />
</div>

    </div>
  );
};

export default AuthPage;
