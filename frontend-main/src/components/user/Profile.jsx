import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../Navbar";
import HeatMapProfile from "./HeatMap";
import "./profile.css";
import { useAuth } from "../../authContext";

const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const { setCurrentUser } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const isEditingParam = queryParams.get("edit") === "true";
  const tabParam = queryParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [isEditing, setIsEditing] = useState(isEditingParam);

  const [repositories, setRepositories] = useState([]);
  const [allRepos, setAllRepos] = useState([]);
  const [starredIds, setStarredIds] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit states
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/userProfile/${userId}`);
        setUserDetails(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, [userId]);

  // Sync edits from URL search changes
  useEffect(() => {
    setIsEditing(queryParams.get("edit") === "true");
    setActiveTab(queryParams.get("tab") || "overview");
  }, [location.search]);

  // Load profile values when userDetails loads
  useEffect(() => {
    if (userId) {
      setEditName(localStorage.getItem(`mygit_name_${userId}`) || userDetails.username || "");
      setEditBio(localStorage.getItem(`mygit_bio_${userId}`) || "Building amazing projects with MyGit.");
      setEditLink(localStorage.getItem(`mygit_link_${userId}`) || "");
      setEditEmail(userDetails.email || "");

      // Load follows
      const follows = JSON.parse(localStorage.getItem(`mygit_follows_${userId}`)) || [];
      setFollowingCount(follows.length);

      // Load stars
      const stars = JSON.parse(localStorage.getItem(`mygit_stars_${userId}`)) || [];
      setStarredIds(stars);
    }
  }, [userDetails, userId]);

  const fetchRepositories = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/repo/user/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setRepositories(data.repositories || []);
      }
    } catch (err) {
      console.error("Error fetching user repos:", err);
    }
  };

  const fetchAllRepos = async () => {
    try {
      const response = await fetch("${import.meta.env.VITE_API_URL}/repo/all");
      const data = await response.json();
      if (response.ok) {
        setAllRepos(data || []);
      }
    } catch (err) {
      console.error("Error fetching all repos:", err);
    }
  };

  useEffect(() => {
    fetchRepositories();
    fetchAllRepos();

    const fetchUsersCount = async () => {
      try {
        const { data } = await axios.get("${import.meta.env.VITE_API_URL}/allUsers");
        if (data) {
          setFollowersCount(data.length);
        }
      } catch (e) {
        console.error("Error fetching users count for followers:", e);
      }
    };
    fetchUsersCount();
  }, [userId]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    navigate(`/profile?tab=${tabName}`);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaveLoading(true);
    try {
      // Update email via backend PUT api
      await axios.put(`${import.meta.env.VITE_API_URL}/updateProfile/${userId}`, {
        email: editEmail,
      });
      // Save local fields
      localStorage.setItem(`mygit_name_${userId}`, editName);
      localStorage.setItem(`mygit_bio_${userId}`, editBio);
      localStorage.setItem(`mygit_link_${userId}`, editLink);

      setUserDetails((prev) => ({ ...prev, email: editEmail }));
      setIsEditing(false);
      navigate("/profile");
    } catch (err) {
      console.error("Error saving profile details:", err);
      alert("Failed to save profile. Check backend server connection.");
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleStarRepo = (repoId) => {
    if (!userId) return;
    let updatedStars = [...starredIds];
    if (updatedStars.includes(repoId)) {
      updatedStars = updatedStars.filter((id) => id !== repoId);
    } else {
      updatedStars.push(repoId);
    }
    setStarredIds(updatedStars);
    localStorage.setItem(`mygit_stars_${userId}`, JSON.stringify(updatedStars));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    window.location.href = "/auth";
  };

  const starredReposList = allRepos.filter((repo) => starredIds.includes(repo._id));

  return (
    <>
      <Navbar />
      <div className="github-profile-page">
        <div className="profile-container">
          
          {/* Left Column - User Info Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-avatar-large">
              {(userDetails.username || "U")[0].toUpperCase()}
            </div>
            
            {!isEditing ? (
              <>
                <div className="profile-names-wrapper">
                  <h1 className="profile-fullname">
                    {localStorage.getItem(`mygit_name_${userId}`) || userDetails.username || "Loading..."}
                  </h1>
                  <span className="profile-username">{userDetails.username || "username"}</span>
                </div>

                <div className="profile-bio-section">
                  <p className="profile-bio-text">
                    {localStorage.getItem(`mygit_bio_${userId}`) || "Building amazing projects with MyGit."}
                  </p>
                  <button className="btn btn-block mt-2" onClick={() => setIsEditing(true)}>
                    Edit profile
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="edit-profile-form mt-2 mb-3">
                <div className="form-group-edit">
                  <label className="edit-label">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="edit-input"
                  />
                </div>
                <div className="form-group-edit mt-2">
                  <label className="edit-label">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Add a bio"
                    maxLength={160}
                    className="edit-textarea"
                    rows={3}
                  />
                </div>
                <div className="form-group-edit mt-2">
                  <label className="edit-label">Website</label>
                  <input
                    type="text"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="Website"
                    className="edit-input"
                  />
                </div>
                <div className="form-group-edit mt-2">
                  <label className="edit-label">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    className="edit-input"
                  />
                </div>
                <div className="edit-actions-row mt-3">
                  <button type="submit" className="btn btn-primary btn-sm-save" disabled={saveLoading}>
                    {saveLoading ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="btn btn-sm-cancel" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="profile-social-stats">
              <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="social-icon">
                <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236 5.507 5.507 0 0 1 3.102-4.06A3.49 3.49 0 0 1 2 5.5ZM5.5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12.5 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm-1.898.549A4.512 4.512 0 0 1 15 12.633a.75.75 0 1 1-1.482.235 3.003 3.003 0 0 0-5.776 0 .75.75 0 1 1-1.482-.236 4.512 4.512 0 0 1 3.102-4.06c-.456-.549-.738-1.25-.738-2.018a3.993 3.993 0 0 1 2.203-3.58.75.75 0 0 1 1.09.824 2.49 2.49 0 0 0-.203.956 2.5 2.5 0 0 0 .102.733Z"></path>
              </svg>
              <span className="social-count text-bold">{followersCount}</span>&nbsp;<span className="text-muted mr-2">followers</span>
              <span className="social-dot">&middot;</span>
              <span className="social-count text-bold">{followingCount}</span>&nbsp;<span className="text-muted">following</span>
            </div>

            <div className="profile-details-list">
              <div className="profile-detail-item">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                  <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 5.25v7c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-7H1.5Zm13-1.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V4.5h13v-.75Z"></path>
                </svg>
                <a href={`mailto:${userDetails.email || ""}`}>{userDetails.email || "email@domain.com"}</a>
              </div>
              {localStorage.getItem(`mygit_link_${userId}`) && (
                <div className="profile-detail-item mt-1">
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 0-1.06 1.06 5 5 0 0 0 7.07 0l2.5-2.5a5 5 0 0 0-7.07-7.07l-1.25 1.25Zm-4.2 4.95a.75.75 0 0 0-1.06-1.06l-1.25 1.25a5 5 0 0 0 7.07 7.07l1.25-1.25a.75.75 0 1 0-1.06-1.06l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .75.75 0 0 0 1.06-1.06 5 5 0 0 0-7.07 0l-2.5 2.5Z"></path>
                  </svg>
                  <a href={localStorage.getItem(`mygit_link_${userId}`)} target="_blank" rel="noopener noreferrer">
                    {localStorage.getItem(`mygit_link_${userId}`)}
                  </a>
                </div>
              )}
            </div>

            <button className="btn btn-danger btn-block mt-4" onClick={logout}>Sign out</button>
          </aside>

          {/* Right Column - Tabs and Profile Content */}
          <main className="profile-main-content">
            
            {/* Profile Navigation Tabs */}
            <div className="profile-tabs-wrapper border-bottom">
              <nav className="profile-nav-tabs">
                <button
                  className={`profile-nav-tab ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => handleTabChange("overview")}
                >
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Z"></path>
                  </svg>
                  Overview
                </button>
                <button
                  className={`profile-nav-tab ${activeTab === "repositories" ? "active" : ""}`}
                  onClick={() => handleTabChange("repositories")}
                >
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8z"></path>
                  </svg>
                  Repositories
                </button>
                <button
                  className={`profile-nav-tab ${activeTab === "stars" ? "active" : ""}`}
                  onClick={() => handleTabChange("stars")}
                >
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                  </svg>
                  Stars
                </button>
              </nav>
            </div>

            {activeTab === "overview" && (
              <div className="overview-content mt-4">
                {/* Pinned repos section */}
                <section className="profile-content-section">
                  <div className="section-header-row mb-2">
                    <h3 className="profile-content-title">Pinned</h3>
                    <span className="customize-pins-link">Customize your pins</span>
                  </div>

                  <div className="profile-pinned-grid">
                    {repositories.slice(0, 6).map((repo) => (
                      <div key={repo._id} className="pinned-repo-card">
                        <div className="pinned-repo-header">
                          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="repo-icon">
                            <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"></path>
                          </svg>
                          <Link to={`/repo/${repo._id}`} className="pinned-repo-link-text">{repo.name}</Link>
                          <span className="pinned-visibility-badge">
                            {repo.visibility ? "Public" : "Private"}
                          </span>
                        </div>
                        <p className="pinned-repo-desc">{repo.description || "No description provided."}</p>
                        <div className="pinned-repo-meta">
                          <span className="pinned-repo-meta-item">
                            <span className="language-dot-span" style={{ backgroundColor: "#f1e05a" }}></span>
                            JavaScript
                          </span>
                          <span className="pinned-repo-meta-item" style={{ cursor: "pointer" }} onClick={() => toggleStarRepo(repo._id)}>
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="star-icon" style={{ color: starredIds.includes(repo._id) ? "#e3b341" : "inherit" }}>
                              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                            </svg>
                            {starredIds.includes(repo._id) ? "Starred" : "Star"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {repositories.length === 0 && (
                      <p className="text-muted" style={{ gridColumn: "1 / span 2" }}>No repositories created yet. Go to Dashboard and click "New" to start!</p>
                    )}
                  </div>
                </section>

                {/* Heatmap graph section */}
                <section className="profile-content-section mt-4">
                  <HeatMapProfile />
                </section>

                {/* Activity log section */}
                <section className="profile-content-section mt-4">
                  <h3 className="profile-content-title mb-2">Contribution activity</h3>
                  <div className="contribution-timeline">
                    <div className="timeline-year-group">
                      <span className="timeline-year-title">2026</span>
                      <div className="timeline-items">
                        <div className="timeline-item">
                          <div className="timeline-icon-dot"></div>
                          <div className="timeline-content-text">
                            Created {repositories.length} repository and committed changes to <span className="text-bold">MyGit</span>
                            <span className="timeline-date">June 2026</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "repositories" && (
              <div className="repositories-tab-content mt-4">
                <div className="repo-search-bar border-bottom pb-3 mb-3">
                  <input type="text" placeholder="Search repositories..." className="repo-search-input-field" />
                </div>
                <div className="profile-repo-list-container">
                  {repositories.length === 0 ? (
                    <p className="text-muted">No repositories found.</p>
                  ) : (
                    repositories.map((repo) => (
                      <div key={repo._id} className="profile-repo-item-row border-bottom pb-4 mb-4">
                        <div className="repo-row-left">
                          <h3 className="repo-row-title"><Link to={`/repo/${repo._id}`}>{repo.name}</Link></h3>
                          <p className="repo-row-desc">{repo.description || "No description provided."}</p>
                          <div className="repo-row-meta mt-2">
                            <span className="repo-meta-span"><span className="language-dot-span" style={{ backgroundColor: "#f1e05a" }}></span>JavaScript</span>
                            <span className="repo-meta-span">{repo.visibility ? "Public" : "Private"}</span>
                          </div>
                        </div>
                        <div className="repo-row-right">
                          <button className="btn btn-star-action" onClick={() => toggleStarRepo(repo._id)}>
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ color: starredIds.includes(repo._id) ? "#e3b341" : "inherit" }}>
                              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                            </svg>
                            {starredIds.includes(repo._id) ? "Starred" : "Star"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "stars" && (
              <div className="repositories-tab-content mt-4">
                <div className="profile-repo-list-container">
                  {starredReposList.length === 0 ? (
                    <div className="explore-empty-card" style={{ border: "1px dashed #30363d", padding: "32px", borderRadius: "6px", textAlign: "center" }}>
                      <p className="text-muted">You haven't starred any repositories yet.</p>
                    </div>
                  ) : (
                    starredReposList.map((repo) => (
                      <div key={repo._id} className="profile-repo-item-row border-bottom pb-4 mb-4">
                        <div className="repo-row-left">
                          <h3 className="repo-row-title">
                            <Link to={`/repo/${repo._id}`}>
                              {repo.owner?.username || "owner"}/{repo.name}
                            </Link>
                          </h3>
                          <p className="repo-row-desc">{repo.description || "No description available."}</p>
                          <div className="repo-row-meta mt-2">
                            <span className="repo-meta-span">
                              <span className="language-dot-span" style={{ backgroundColor: "#f1e05a" }}></span>
                              JavaScript
                            </span>
                            <span className="repo-meta-span">{repo.visibility ? "Public" : "Private"}</span>
                          </div>
                        </div>
                        <div className="repo-row-right">
                          <button className="btn btn-star-action starred" onClick={() => toggleStarRepo(repo._id)}>
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ color: "#e3b341" }}>
                              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                            </svg>
                            Unstar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Profile;
