import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../authContext";
import "./navbar.css";

import logo from "../assets/github-mark-white.svg";

const Navbar = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [bellYellow, setBellYellow] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/userProfile/${userId}`);
        if (data && data.username) {
          setUsername(data.username);
        }
      } catch (e) {
        console.error("Error fetching user in navbar:", e);
      }
    };
    if (currentUser) {
      fetchUser();
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/auth");
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (createDropdownOpen) setCreateDropdownOpen(false);
  };

  const toggleCreateDropdown = () => {
    setCreateDropdownOpen(!createDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  useEffect(() => {
    const closeDropdowns = (e) => {
      if (!e.target.closest(".header-dropdown-container")) {
        setProfileDropdownOpen(false);
        setCreateDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdowns);
    return () => document.removeEventListener("click", closeDropdowns);
  }, []);

  return (
    <header className="github-header">
      <div className="header-left">
        <Link to="/" className="header-logo-link">
          <img src={logo} alt="MyGit" className="header-logo" />
        </Link>

        <div className="header-search-container">
          <div className="header-search-wrapper">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="header-search-icon">
              <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="header-search-input"
            />
          </div>
        </div>

        <nav className="header-nav">
          <Link to="/" className={`header-nav-link ${location.pathname === "/" ? "active" : ""}`}>
            Dashboard
          </Link>
          <Link to="/profile" className={`header-nav-link ${location.pathname === "/profile" && !location.search ? "active" : ""}`}>
            Pull requests
          </Link>
          <Link to="/issues" className={`header-nav-link ${location.pathname === "/issues" ? "active" : ""}`}>
            Issues
          </Link>
          <Link to="/community" className={`header-nav-link ${location.pathname === "/community" ? "active" : ""}`}>
            Community
          </Link>
        </nav>
      </div>

      <div className="header-right">
        {/* Create Dropdown */}
        <div className="header-dropdown-container">
          <button className="header-icon-btn" onClick={toggleCreateDropdown} aria-label="Create new...">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
            </svg>
            <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" fill="currentColor" style={{ marginLeft: "2px" }}>
              <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"></path>
            </svg>
          </button>
          {createDropdownOpen && (
            <div className="header-dropdown-menu dropdown-menu-right">
              <Link to="/create" className="dropdown-item">Create repository</Link>
              <Link to="/issues?new=true" className="dropdown-item">Create issue</Link>
              <Link to="/profile" className="dropdown-item">Profile</Link>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          className="header-icon-btn"
          aria-label="Notifications"
          onClick={() => setBellYellow(!bellYellow)}
          style={{ color: bellYellow ? "#f5c60d" : "#8b949e" }}
        >
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
            <path d="M8 16a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2ZM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917ZM14.25 12a.75.75 0 0 1-.75.75H2.5a.75.75 0 0 1-.75-.75.75.75 0 0 1 .465-.694A5.46 5.46 0 0 0 4.5 9c0-.638.125-2.036.434-3.52C5.3 3.864 6.46 3 8 3s2.7 3.864 3.066 5.48c.309 1.484.434 2.882.434 3.52a5.46 5.46 0 0 0 2.285 2.306.75.75 0 0 1 .465.694Z"></path>
          </svg>
        </button>

        {/* Profile Dropdown */}
        <div className="header-dropdown-container">
          <button className="header-avatar-btn" onClick={toggleProfileDropdown} aria-label="User profile options">
            <span className="header-avatar-letter">
              {(username || "U")[0].toUpperCase()}
            </span>
            <svg aria-hidden="true" height="8" viewBox="0 0 16 16" width="8" fill="currentColor">
              <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z"></path>
            </svg>
          </button>
          {profileDropdownOpen && (
            <div className="header-dropdown-menu dropdown-menu-right">
              <div className="dropdown-user-header">
                Signed in as <span className="dropdown-username">{username || "User"}</span>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/profile" className="dropdown-item">Your profile</Link>
              <Link to="/" className="dropdown-item">Your repositories</Link>
              <Link to="/profile?tab=stars" className="dropdown-item">Your stars</Link>
              <div className="dropdown-divider"></div>
              <Link to="/profile?edit=true" className="dropdown-item">Settings</Link>
              <button onClick={handleLogout} className="dropdown-item dropdown-btn-link">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;