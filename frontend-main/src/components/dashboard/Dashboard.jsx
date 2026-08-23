import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../authContext";
import Navbar from "../Navbar";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { cachedUsername, updateCachedUsername } = useAuth();
  const userId = localStorage.getItem("userId");

  // Synchronous cache reads to eliminate FOUC on page load/refresh
  const [repositories, setRepositories] = useState(() => {
    if (!userId) return [];
    try {
      const cached = localStorage.getItem(`mygit_repos_${userId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (_) { return []; }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState(() => {
    try {
      const cached = localStorage.getItem("mygit_all_repos");
      return cached ? JSON.parse(cached) : [];
    } catch (_) { return []; }
  });
  const [searchResults, setSearchResults] = useState(() => repositories);
  const [username, setUsername] = useState(cachedUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [starredIds, setStarredIds] = useState([]);

  // Create repository modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [newRepoVisibility, setNewRepoVisibility] = useState(true); // true = Public, false = Private
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (userId) {
      const stars = JSON.parse(localStorage.getItem(`mygit_stars_${userId}`)) || [];
      setStarredIds(stars);
    }
  }, [userId]);

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

  const fetchRepositories = async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/repo/user/${userId}`
      );
      const data = await response.json();
      if (response.ok) {
        const repos = data.repositories || [];
        setRepositories(repos);
        localStorage.setItem(`mygit_repos_${userId}`, JSON.stringify(repos));
      }
    } catch (err) {
      console.error("Error while fetching repositories:", err);
    }
  };

  const fetchSuggestedRepositories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/repo/all`);
      const data = await response.json();
      if (response.ok) {
        const repos = data || [];
        setSuggestedRepositories(repos);
        localStorage.setItem("mygit_all_repos", JSON.stringify(repos));
      }
    } catch (err) {
      console.error("Error while fetching suggested repositories:", err);
    }
  };

  const fetchUserProfile = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/userProfile/${userId}`);
      if (data && data.username) {
        setUsername(data.username);
        updateCachedUsername(data.username);
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchRepositories(), fetchSuggestedRepositories(), fetchUserProfile()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(repositories);
    } else {
      const filtered = repositories.filter((repo) =>
        repo && repo.name && repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [repositories, searchQuery]);

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) {
      setModalError("Repository name is required.");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/repo/create`, {
        owner: userId,
        name: newRepoName.trim(),
        description: newRepoDesc.trim(),
        visibility: newRepoVisibility,
        content: [],
        issues: []
      });

      if (res.status === 201) {
        // Success
        setNewRepoName("");
        setNewRepoDesc("");
        setNewRepoVisibility(true);
        setIsModalOpen(false);
        // Refresh repository list
        fetchRepositories();
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.error || "Failed to create repository.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        {/* Left Sidebar - User Repositories */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header-wrapper">
            <h2 className="sidebar-section-title">Top Repositories</h2>
            <button className="btn btn-primary btn-sm-new" onClick={() => navigate("/create")}>
              <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ marginRight: "4px" }}>
                <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"></path>
              </svg>
              New
            </button>
          </div>

          <div className="sidebar-search-container">
            <input
              type="text"
              placeholder="Find a repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
          </div>

          <ul className="sidebar-repo-list">
            {searchResults.length === 0 ? (
              <li className="sidebar-repo-empty">No repositories found</li>
            ) : (
              searchResults.map((repo) => (
                <li key={repo._id} className="sidebar-repo-item">
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="repo-icon-svg">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8z"></path>
                  </svg>
                  <Link to={`/repo/${repo._id}`} className="sidebar-repo-link">
                    <span className="repo-owner-name">{repo.owner?.username || username || cachedUsername || localStorage.getItem("mygit_cached_username") || "user"}</span>
                    <span className="repo-slash">/</span>
                    <span className="repo-name-text">{repo.name}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* Center Main Feed */}
        <main className="dashboard-feed">
          <div className="feed-header">
            <h1 className="feed-title">Home</h1>
            <div className="feed-tabs">
              <button className="feed-tab active">For you</button>
            </div>
          </div>

          <div className="feed-content">
            <h2 className="feed-section-heading">Explore repositories</h2>
            <div className="explore-list">
              {suggestedRepositories.length === 0 ? (
                <div className="explore-empty-card">
                  <p>No suggested repositories available at this moment.</p>
                </div>
              ) : (
                suggestedRepositories.slice(0, 6).map((repo) => (
                  <div key={repo._id} className="explore-card">
                    <div className="explore-card-header">
                      <div className="explore-repo-title">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="repo-icon-svg">
                          <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"></path>
                        </svg>
                        <Link to={`/repo/${repo._id}`} className="explore-repo-link">
                          <span className="repo-owner-name">{repo.owner?.username || "developer"}</span>
                          <span className="repo-slash">/</span>
                          <span className="repo-name-text">{repo.name}</span>
                        </Link>
                      </div>
                      <button
                        className="btn btn-star-action"
                        onClick={() => toggleStarRepo(repo._id)}
                      >
                        <svg
                          aria-hidden="true"
                          height="16"
                          viewBox="0 0 16 16"
                          width="16"
                          fill="currentColor"
                          className="star-icon"
                          style={{ color: starredIds.includes(repo._id) ? "#e3b341" : "inherit" }}
                        >
                          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                        </svg>
                        {starredIds.includes(repo._id) ? "Starred" : "Star"}
                      </button>
                    </div>
                    <p className="explore-repo-description">
                      {repo.description || "No description available."}
                    </p>
                    <div className="explore-repo-meta">
                      <span className="repo-meta-item">
                        <span className="language-color-dot" style={{ backgroundColor: "#f1e05a" }}></span>
                        JavaScript
                      </span>
                      <span className="repo-meta-item">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 1.937 4.185a.75.75 0 0 1-1.059.816L8 12.167 4.161 14.17a.75.75 0 0 1-1.059-.816l1.937-4.185-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z"></path>
                        </svg>
                        0
                      </span>
                      <span className="repo-meta-item">
                        Public
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Static GitHub Activity items */}
            <div className="recent-activity-section">
              <h3 className="feed-subheading">Latest Activity</h3>
              <div className="activity-card">
                <div className="activity-card-header">
                  <div className="activity-user-avatar">{(username || cachedUsername || "U")[0].toUpperCase()}</div>
                  <div className="activity-header-text">
                    <span className="text-bold">{username || cachedUsername || "You"}</span> created repository <span className="text-bold">MyGit</span>
                  </div>
                  <span className="activity-time">3 days ago</span>
                </div>
              </div>
              <div className="activity-card">
                <div className="activity-card-header">
                  <div className="activity-user-avatar dev-avatar">D</div>
                  <div className="activity-header-text">
                    <span className="text-bold">developer</span> pushed commits to <span className="text-bold">Portfolio</span>
                  </div>
                  <span className="activity-time">4 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Latest Changes & Events */}
        <aside className="dashboard-right-sidebar">
          <div className="changelog-container">
            <h3 className="right-sidebar-title">Latest changes</h3>
            <ul className="changelog-list">
              <li className="changelog-item">
                <span className="changelog-date">10 hrs ago</span>
                <a href="#" className="changelog-link">GitHub Copilot: Updates to model configuration in VS Code</a>
              </li>
              <li className="changelog-item">
                <span className="changelog-date">1 day ago</span>
                <a href="#" className="changelog-link">Code Security: General availability of code scanning alerts</a>
              </li>
              <li className="changelog-item">
                <span className="changelog-date">3 days ago</span>
                <a href="#" className="changelog-link">GitHub Actions: Node.js 20 actions updates</a>
              </li>
            </ul>
            <a href="#" className="changelog-view-all">View changelog →</a>
          </div>

          <div className="right-sidebar-explore">
            <h3 className="right-sidebar-title">Explore repositories</h3>
            <div className="explore-suggestion-card">
              <h4 className="suggestion-repo-name">facebook/react</h4>
              <p className="suggestion-repo-desc">The library for web and native user interfaces.</p>
              <div className="suggestion-repo-meta">
                <span>⭐ 224k</span>
                <span>JavaScript</span>
              </div>
            </div>
            <div className="explore-suggestion-card">
              <h4 className="suggestion-repo-name">nodejs/node</h4>
              <p className="suggestion-repo-desc">Node.js JavaScript runtime ✨🐢🚀</p>
              <div className="suggestion-repo-meta">
                <span>⭐ 104k</span>
                <span>C++</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Create Repo Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create a new repository</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            {modalError && (
              <div className="modal-error-banner">
                {modalError}
              </div>
            )}
            <form onSubmit={handleCreateRepo}>
              <div className="modal-form-group">
                <label className="modal-label">Owner</label>
                <div className="owner-badge">
                  <span className="owner-avatar-letter">{(username || "U")[0].toUpperCase()}</span>
                  <span className="owner-username">{username || "Loading..."}</span>
                </div>
              </div>

              <div className="modal-form-group">
                <label htmlFor="repoName" className="modal-label">Repository name *</label>
                <input
                  type="text"
                  id="repoName"
                  placeholder="e.g. hello-world"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  required
                  autoFocus
                  className="modal-text-input"
                />
                <p className="modal-input-hint">Great repository names are short and memorable. Need inspiration? How about <span className="text-success-hint">special-fortnight</span>?</p>
              </div>

              <div className="modal-form-group">
                <label htmlFor="repoDesc" className="modal-label">Description <span className="text-muted">(optional)</span></label>
                <textarea
                  id="repoDesc"
                  placeholder="Description of the repository"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  rows="3"
                  className="modal-textarea"
                />
              </div>

              <div className="modal-form-group border-top-group">
                <div className="visibility-options">
                  <label className="visibility-option-label">
                    <input
                      type="radio"
                      name="repoVisibility"
                      checked={newRepoVisibility === true}
                      onChange={() => setNewRepoVisibility(true)}
                    />
                    <div className="visibility-text-wrapper">
                      <span className="visibility-title">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ marginRight: "6px", verticalAlign: "text-bottom" }}>
                          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.5-3.25V7h1.25a.75.75 0 0 1 0 1.5H9v2.25a.75.75 0 0 1-1.5 0V8.5H6.25a.75.75 0 0 1 0-1.5H7.5V4.75a.75.75 0 0 1 1.5 0Z"></path>
                        </svg>
                        Public
                      </span>
                      <span className="visibility-desc">Anyone on the internet can see this repository. You choose who can commit.</span>
                    </div>
                  </label>

                  <label className="visibility-option-label">
                    <input
                      type="radio"
                      name="repoVisibility"
                      checked={newRepoVisibility === false}
                      onChange={() => setNewRepoVisibility(false)}
                    />
                    <div className="visibility-text-wrapper">
                      <span className="visibility-title">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ marginRight: "6px", verticalAlign: "text-bottom" }}>
                          <path d="M4 5.5a4 4 0 0 1 8 0v2H4v-2zM3 7.5V11c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V7.5H3zM2 5.5a6 6 0 0 1 12 0v2h.75c.69 0 1.25.56 1.25 1.25v4.5c0 .69-.56 1.25-1.25 1.25H1.25A1.25 1.25 0 0 1 0 13.25v-4.5C0 8.06.56 7.5 1.25 7.5H2v-2z"></path>
                        </svg>
                        Private
                      </span>
                      <span className="visibility-desc">You choose who can see and commit to this repository.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? "Creating..." : "Create repository"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;