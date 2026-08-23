import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import { useAuth } from "../../authContext";
import "./repodetail.css";

const RepoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { cachedUsername } = useAuth();

  // Synchronous cache lookup to eliminate loading flash on navigation
  const [repo, setRepo] = useState(() => {
    try {
      const userRepos = JSON.parse(localStorage.getItem(`mygit_repos_${userId}`)) || [];
      const found = userRepos.find((r) => r._id === id);
      if (found) return found;
      const allRepos = JSON.parse(localStorage.getItem("mygit_all_repos")) || [];
      return allRepos.find((r) => r._id === id) || null;
    } catch (_) { return null; }
  });
  const [loading, setLoading] = useState(() => !repo);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [backendIssues, setBackendIssues] = useState([]);

  useEffect(() => {
    const fetchRepoAndIssues = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/repo/${id}`);
        const repoData = Array.isArray(data) ? data[0] : data;
        if (repoData) {
          setRepo(repoData);
        } else if (!repo) {
          setError("Repository not found.");
        }
      } catch (err) {
        console.error("Error fetching repository:", err);
        if (!repo) setError("Failed to load repository.");
      } finally {
        setLoading(false);
      }

      try {
        const issuesRes = await axios.get(`${import.meta.env.VITE_API_URL}/issue/all`);
        if (Array.isArray(issuesRes.data)) {
          setBackendIssues(issuesRes.data);
        }
      } catch (e) {
        console.error("Error fetching repo issues:", e);
      }
    };

    fetchRepoAndIssues();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/repo/delete/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Error deleting repository:", err);
      alert("Failed to delete repository.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Get issues combined from MongoDB Atlas populated repo, backend issue endpoint, and local caches
  const getRepoIssues = () => {
    const combinedMap = new Map();

    // 1. Issues directly inside repo document (populated from backend)
    if (repo && Array.isArray(repo.issues)) {
      repo.issues.forEach((iss) => {
        if (typeof iss === "object" && iss && iss._id) {
          combinedMap.set(iss._id.toString(), {
            _id: iss._id.toString(),
            title: iss.title || "Untitled Issue",
            description: iss.description || "",
            status: iss.status || "open",
            createdAt: iss.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    // 2. Issues fetched from GET /issue/all matching this repository
    if (Array.isArray(backendIssues)) {
      backendIssues.forEach((iss) => {
        const repoIdStr = typeof iss.repository === "object" && iss.repository ? (iss.repository._id || "").toString() : (iss.repository || "").toString();
        if (repoIdStr === id.toString() || iss.repositoryId === id.toString()) {
          combinedMap.set(iss._id.toString(), {
            _id: iss._id.toString(),
            title: iss.title || "Untitled Issue",
            description: iss.description || "",
            status: iss.status || "open",
            createdAt: iss.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    // 3. Issues saved in localStorage (user or global issues cache)
    const userStored = userId ? (JSON.parse(localStorage.getItem(`mygit_issues_${userId}`)) || []) : [];
    const globalStored = JSON.parse(localStorage.getItem("mygit_all_issues")) || [];
    [...userStored, ...globalStored].forEach((iss) => {
      const targetId = (iss.repositoryId || iss.repository || "").toString();
      if (targetId === id.toString()) {
        combinedMap.set(iss._id.toString(), {
          _id: iss._id.toString(),
          title: iss.title || "Untitled Issue",
          description: iss.description || "",
          status: iss.status || "open",
          createdAt: iss.createdAt || new Date().toISOString(),
        });
      }
    });

    return Array.from(combinedMap.values());
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="repo-detail-page">
          <div className="repo-detail-container">
            <div className="repo-detail-loading">Loading repository...</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !repo) {
    return (
      <>
        <Navbar />
        <div className="repo-detail-page">
          <div className="repo-detail-container">
            <div className="repo-detail-error">{error || "Repository not found."}</div>
            <Link to="/" className="repo-back-link">← Back to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  const ownerName = repo.owner?.username || cachedUsername || localStorage.getItem("mygit_cached_username") || "user";
  const issues = getRepoIssues();

  return (
    <>
      <Navbar />
      <div className="repo-detail-page">
        <div className="repo-detail-container">

          <Link to="/" className="repo-back-link">← Back to Dashboard</Link>

          {/* Header */}
          <div className="repo-detail-header">
            <div className="repo-detail-title-section">
              <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="repo-detail-icon">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8z"></path>
              </svg>
              <span className="repo-detail-owner">{ownerName}</span>
              <span className="repo-detail-slash">/</span>
              <span className="repo-detail-name">{repo.name}</span>
              <span className="repo-visibility-badge">{repo.visibility ? "Public" : "Private"}</span>
            </div>

            {repo.owner && (repo.owner._id === userId || repo.owner === userId) && (
              <button className="repo-delete-btn" onClick={() => setShowDeleteModal(true)}>
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.15l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                </svg>
                Delete
              </button>
            )}
          </div>

          {/* Simple info rows */}
          <div className="repo-detail-info">
            <div className="repo-detail-info-row">
              <span className="repo-detail-label">Name</span>
              <span className="repo-detail-value">{repo.name}</span>
            </div>
            <div className="repo-detail-info-row">
              <span className="repo-detail-label">Owner</span>
              <span className="repo-detail-value">{ownerName}</span>
            </div>
            <div className="repo-detail-info-row">
              <span className="repo-detail-label">Description</span>
              <span className="repo-detail-value">{repo.description || "No description provided."}</span>
            </div>
            <div className="repo-detail-info-row">
              <span className="repo-detail-label">Visibility</span>
              <span className={`repo-detail-value ${repo.visibility ? "visibility-public" : "visibility-private"}`}>
                {repo.visibility ? "Public" : "Private"}
              </span>
            </div>
            <div className="repo-detail-info-row">
              <span className="repo-detail-label">Issues</span>
              <span className="repo-detail-value">{issues.length}</span>
            </div>
          </div>

          {/* Version Control */}
          <div className="repo-vc-section">
            <h3 className="repo-vc-title">Version Control</h3>
            <p className="repo-vc-text">
              This repository uses the MyGit CLI. Perform init, add, commit, push, pull, and revert from your local project directory. Commit snapshots are stored in Amazon S3.
            </p>
          </div>

          {/* Issues */}
          <div className="repo-issues-section">
            <h3 className="repo-issues-title">
              Issues
              <span className="repo-issues-count-badge">{issues.length}</span>
            </h3>

            {issues.length === 0 ? (
              <p className="repo-issues-empty">No issues have been created for this repository.</p>
            ) : (
              issues.map((issue) => (
                <div key={issue._id} className="repo-issue-item">
                  <span className={issue.status === "open" ? "repo-issue-icon-open" : "repo-issue-icon-closed"}>
                    {issue.status === "open" ? (
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                      </svg>
                    ) : (
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                      </svg>
                    )}
                  </span>
                  <div className="repo-issue-info">
                    <span className="repo-issue-title-text">{issue.title}</span>
                    <span className="repo-issue-desc">{issue.description}</span>
                    <span className="repo-issue-meta">
                      #{issue._id ? issue._id.toString().substring(0, 8) : "issue"} · {issue.status === "open" ? "Open" : "Closed"} · {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <h3 className="delete-modal-title">Delete this repository?</h3>
            <p className="delete-modal-text">
              This action <strong>cannot be undone</strong>. This will permanently delete the <strong>{repo.name}</strong> repository and all associated data from the database.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="delete-modal-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete this repository"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RepoDetail;
