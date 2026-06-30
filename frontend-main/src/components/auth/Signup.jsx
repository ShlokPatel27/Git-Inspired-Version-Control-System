import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.post("http://localhost:3000/signup", {
        email: email,
        password: password,
        username: username,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      setCurrentUser(res.data.userId);
      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrorMsg("Signup Failed! User might already exist or invalid input.");
      setLoading(false);
    }
  };

  return (
    <div className="github-auth-page">
      <div className="auth-header">
        <Link to="/">
          <img className="auth-logo" src={logo} alt="MyGit Logo" />
        </Link>
        <h1 className="auth-title">Create your account</h1>
      </div>

      <div className="auth-container">
        {errorMsg && (
          <div className="auth-error-banner">
            <span>{errorMsg}</span>
            <button className="close-banner-btn" onClick={() => setErrorMsg("")}>&times;</button>
          </div>
        )}

        <div className="auth-card">
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                autoComplete="off"
                name="username"
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
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
              <label htmlFor="password">Password</label>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <div className="auth-prompt-card">
          <p>
            Already have an account? <Link to="/auth">Sign in</Link>.
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

export default Signup;
