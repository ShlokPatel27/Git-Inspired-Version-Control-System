import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { setCurrentUser, updateCachedUsername } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        email: email,
        password: password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      setCurrentUser(res.data.userId);

      // Fetch and cache username for instant display on future refreshes
      try {
        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/userProfile/${res.data.userId}`);
        if (profileRes.data && profileRes.data.username) {
          updateCachedUsername(profileRes.data.username);
        }
      } catch (_) {}

      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrorMsg("Incorrect username or password.");
      setLoading(false);
    }
  };

  return (
    <div className="github-auth-page">
      <div className="auth-header">
        <Link to="/">
          <img className="auth-logo" src={logo} alt="MyGit Logo" />
        </Link>
        <h1 className="auth-title">Sign in to MyGit</h1>
      </div>

      <div className="auth-container">
        {errorMsg && (
          <div className="auth-error-banner">
            <span>{errorMsg}</span>
            <button className="close-banner-btn" onClick={() => setErrorMsg("")}>&times;</button>
          </div>
        )}

        <div className="auth-card">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Username or email address</label>
              <input
                autoComplete="off"
                name="email"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="label-wrapper">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-password-link">Forgot password?</a>
              </div>
              <input
                autoComplete="off"
                name="password"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="auth-prompt-card">
          <p>
            New to MyGit? <Link to="/signup">Create an account</Link>.
          </p>
        </div>
      </div>

      <footer className="auth-footer">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
        <a href="#">Docs</a>
        <a href="#">Contact MyGit Support</a>
      </footer>
    </div>
  );
};

export default Login;
