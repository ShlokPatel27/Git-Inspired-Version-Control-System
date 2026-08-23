import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "./issues.css";

const Issues = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const triggerNewVal = queryParams.get("new") === "true";

  const userId = localStorage.getItem("userId");

  // Synchronous cache reads to eliminate FOUC on page load/refresh
  const [issues, setIssues] = useState(() => {
    const local = userId ? (JSON.parse(localStorage.getItem(`mygit_issues_${userId}`)) || []) : [];
    const global = JSON.parse(localStorage.getItem("mygit_all_issues")) || [];
    const combined = new Map();
    local.forEach((i) => combined.set(i._id, i));
    global.forEach((i) => combined.set(i._id, i));
    return Array.from(combined.values());
  });
  const [repositories, setRepositories] = useState(() => {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(`mygit_repos_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (_) { return []; }
  });
  const [filter, setFilter] = useState("open"); // open or closed
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(triggerNewVal);

  // New Issue Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState(() => {
    try {
      const stored = localStorage.getItem(`mygit_repos_${userId}`);
      const repos = stored ? JSON.parse(stored) : [];
      return repos.length > 0 ? repos[0]._id : "";
    } catch (_) { return ""; }
  });
  const [loading, setLoading] = useState(false);

  // Sync with URL query param `?new=true`
  useEffect(() => {
    setShowNewForm(queryParams.get("new") === "true");
  }, [location.search]);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      // 1. Fetch repositories from backend
      let fetchedRepos = [];
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/repo/user/${userId}`);
        if (data && data.repositories) {
          fetchedRepos = data.repositories;
          setRepositories(fetchedRepos);
          localStorage.setItem(`mygit_repos_${userId}`, JSON.stringify(fetchedRepos));
          if (fetchedRepos.length > 0 && !selectedRepoId) {
            setSelectedRepoId(fetchedRepos[0]._id);
          }
        }
      } catch (e) {
        console.error("Error loading repositories:", e);
      }

      // Also fetch all repos to map repository names and fallback issues
      let allReposList = [];
      try {
        const { data: allData } = await axios.get(`${import.meta.env.VITE_API_URL}/repo/all`);
        if (Array.isArray(allData)) {
          allReposList = allData;
          localStorage.setItem("mygit_all_repos", JSON.stringify(allData));
        }
      } catch (e) {
        allReposList = JSON.parse(localStorage.getItem("mygit_all_repos")) || [];
      }

      // 2. Fetch issues from backend (MongoDB Atlas)
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/issue/all`);
        if (Array.isArray(data)) {
          const localStored = userId ? (JSON.parse(localStorage.getItem(`mygit_issues_${userId}`)) || []) : [];
          const globalStored = JSON.parse(localStorage.getItem("mygit_all_issues")) || [];
          
          // Map backend issue fields to expected format
          const mappedBackend = data.map((b) => {
            const rawRepo = b.repository;
            const repoIdStr = typeof rawRepo === "object" && rawRepo ? (rawRepo._id || "").toString() : (rawRepo || "").toString();
            const matchingRepo = fetchedRepos.find((r) => (r._id || "").toString() === repoIdStr) || allReposList.find((r) => (r._id || "").toString() === repoIdStr);
            const repoName = (typeof rawRepo === "object" && rawRepo?.name) || matchingRepo?.name || "Repository";

            return {
              _id: b._id,
              title: b.title || "Untitled Issue",
              description: b.description || "",
              status: b.status || "open",
              repositoryId: repoIdStr,
              repositoryName: repoName,
              createdAt: b.createdAt || new Date().toISOString(),
            };
          });

          // Merge local and backend issues by _id
          const combinedMap = new Map();
          localStored.forEach((item) => combinedMap.set(item._id, item));
          globalStored.forEach((item) => combinedMap.set(item._id, item));
          mappedBackend.forEach((item) => combinedMap.set(item._id, item));

          const merged = Array.from(combinedMap.values());
          setIssues(merged);
          if (userId) {
            localStorage.setItem(`mygit_issues_${userId}`, JSON.stringify(merged));
          }
          localStorage.setItem("mygit_all_issues", JSON.stringify(merged));
        }
      } catch (e) {
        console.warn("Backend /issue/all returned error, checking repos fallback:", e.message);
        // Fallback: if /issue/all failed on Render, extract populated issues from allReposList
        if (allReposList && allReposList.length > 0) {
          const extractedFromRepos = [];
          allReposList.forEach((r) => {
            if (Array.isArray(r.issues)) {
              r.issues.forEach((iss) => {
                if (typeof iss === "object" && iss && iss._id) {
                  extractedFromRepos.push({
                    _id: iss._id,
                    title: iss.title || "Untitled Issue",
                    description: iss.description || "",
                    status: iss.status || "open",
                    repositoryId: r._id,
                    repositoryName: r.name,
                    createdAt: iss.createdAt || new Date().toISOString(),
                  });
                }
              });
            }
          });
          if (extractedFromRepos.length > 0) {
            const combinedMap = new Map();
            issues.forEach((item) => combinedMap.set(item._id, item));
            extractedFromRepos.forEach((item) => combinedMap.set(item._id, item));
            const merged = Array.from(combinedMap.values());
            setIssues(merged);
            if (userId) {
              localStorage.setItem(`mygit_issues_${userId}`, JSON.stringify(merged));
            }
            localStorage.setItem("mygit_all_issues", JSON.stringify(merged));
          }
        }
      }
    };
    loadData();
  }, [userId]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const selectedRepo = repositories.find((r) => r._id === selectedRepoId);
    const repoName = selectedRepo ? selectedRepo.name : "general";

    let newIssueObj = {
      _id: "issue_" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      status: "open",
      repositoryId: selectedRepoId,
      repositoryName: repoName,
      createdAt: new Date().toISOString(),
    };

    // Create issue in backend with repo ID in URL
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/issue/create/${selectedRepoId}`, {
        title: title.trim(),
        description: description.trim(),
      });
      // Use the backend-returned _id if available
      if (response.data && response.data._id) {
        newIssueObj._id = response.data._id;
        newIssueObj.createdAt = response.data.createdAt || newIssueObj.createdAt;
      }
    } catch (err) {
      console.warn("Backend issue create error (falling back to localStorage):", err.message);
    }

    // Save locally
    const updatedIssues = [newIssueObj, ...issues];
    setIssues(updatedIssues);
    if (userId) {
      localStorage.setItem(`mygit_issues_${userId}`, JSON.stringify(updatedIssues));
    }
    localStorage.setItem("mygit_all_issues", JSON.stringify(updatedIssues));

    // Reset form
    setTitle("");
    setDescription("");
    setShowNewForm(false);
    setLoading(false);
    navigate("/issues");
  };

  const toggleIssueStatus = async (issueId) => {
    const target = issues.find((i) => i._id === issueId);
    const newStatus = target && target.status === "open" ? "closed" : "open";

    const updated = issues.map((issue) => {
      if (issue._id === issueId) {
        return {
          ...issue,
          status: newStatus,
        };
      }
      return issue;
    });
    setIssues(updated);
    if (userId) {
      localStorage.setItem(`mygit_issues_${userId}`, JSON.stringify(updated));
    }
    localStorage.setItem("mygit_all_issues", JSON.stringify(updated));

    // Sync status change with backend
    try {
      if (target) {
        await axios.put(`${import.meta.env.VITE_API_URL}/issue/update/${issueId}`, {
          title: target.title,
          description: target.description,
          status: newStatus,
        });
      }
    } catch (err) {
      console.warn("Backend status update error:", err.message);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      const updated = issues.filter((issue) => issue._id !== issueId);
      setIssues(updated);
      if (userId) {
        localStorage.setItem(`mygit_issues_${userId}`, JSON.stringify(updated));
      }
      localStorage.setItem("mygit_all_issues", JSON.stringify(updated));

      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/issue/delete/${issueId}`);
      } catch (err) {
        console.warn("Backend delete issue error:", err.message);
      }
    }
  };

  // Filter issues belonging strictly to the current user's repositories
  const userRepoIds = new Set(repositories.map((r) => (r._id || "").toString()));
  const userRepoNames = new Set(repositories.map((r) => (r.name || "").toLowerCase()));

  const userIssues = issues.filter((issue) => {
    // If repositories haven't loaded yet, default to issues cached for this user
    if (repositories.length === 0) return true;
    const targetRepoId = (issue.repositoryId || issue.repository?._id || issue.repository || "").toString();
    const targetRepoName = (issue.repositoryName || issue.repository?.name || "").toLowerCase();
    return userRepoIds.has(targetRepoId) || userRepoNames.has(targetRepoName);
  });

  const filteredIssues = userIssues.filter((issue) => {
    const matchesFilter = issue.status === filter;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.repositoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = userIssues.filter((i) => i.status === "open").length;
  const closedCount = userIssues.filter((i) => i.status === "closed").length;

  return (
    <>
      <Navbar />
      <div className="issues-page">
        <div className="issues-container">
          
          {!showNewForm ? (
            <>
              {/* Header Search & Create */}
              <div className="issues-header-bar">
                <div className="issues-search-wrapper">
                  <input
                    type="text"
                    placeholder="Search all issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="issues-search-input"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/issues?new=true")}
                >
                  New issue
                </button>
              </div>

              {/* Issues Filter & Table Container */}
              <div className="issues-table-container mt-3">
                <div className="issues-table-header">
                  <div className="table-header-left">
                    <button
                      className={`filter-btn ${filter === "open" ? "active" : ""}`}
                      onClick={() => setFilter("open")}
                    >
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                      </svg>
                      {openCount} Open
                    </button>
                    <button
                      className={`filter-btn ${filter === "closed" ? "active" : ""}`}
                      onClick={() => setFilter("closed")}
                    >
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                      </svg>
                      {closedCount} Closed
                    </button>
                  </div>
                </div>

                <div className="issues-list">
                  {filteredIssues.length === 0 ? (
                    <div className="issues-empty text-center p-4">
                      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24" fill="currentColor" className="text-muted mb-2">
                        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                      </svg>
                      <h4 className="text-bold">No results matched your search.</h4>
                      <p className="text-muted">Create a new issue to track feedback or coordinate work.</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <div key={issue._id} className="issue-row border-bottom">
                        <div className="issue-row-left">
                          <span className={issue.status === "open" ? "issue-icon-open" : "issue-icon-closed"}>
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
                          <div className="issue-details">
                            <div className="issue-title-row">
                              <span className="issue-title-text">{issue.title}</span>
                              <span className="issue-repo-badge">{issue.repositoryName}</span>
                            </div>
                            <p className="issue-desc-text text-muted">{issue.description}</p>
                            <span className="issue-meta-text text-muted">
                              #{issue._id.substring(6, 12)} opened on {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="issue-row-right">
                          <button
                            onClick={() => toggleIssueStatus(issue._id)}
                            className="btn btn-sm-action mr-2"
                          >
                            {issue.status === "open" ? "Close" : "Reopen"}
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(issue._id)}
                            className="btn btn-sm-action btn-danger-action"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* New Issue Form */
            <div className="new-issue-form-container">
              <div className="new-issue-header border-bottom pb-2 mb-3">
                <h2 className="new-issue-title">Create a new issue</h2>
              </div>

              <form onSubmit={handleCreateIssue} className="new-issue-form">
                <div className="form-group-issues">
                  <label className="issues-label">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    required
                    className="issues-input"
                  />
                </div>

                <div className="form-group-issues mt-3">
                  <label className="issues-label">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Leave a comment / description"
                    required
                    className="issues-textarea"
                    rows={6}
                  />
                </div>

                <div className="form-group-issues mt-3">
                  <label className="issues-label">Link to Repository</label>
                  {repositories.length === 0 ? (
                    <p className="text-muted font-size-12">
                      No repositories available. Create one first!
                    </p>
                  ) : (
                    <select
                      value={selectedRepoId}
                      onChange={(e) => setSelectedRepoId(e.target.value)}
                      className="issues-select"
                    >
                      {repositories.map((repo) => (
                        <option key={repo._id} value={repo._id}>
                          {repo.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="new-issue-actions mt-4 border-top pt-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || repositories.length === 0}
                  >
                    {loading ? "Creating..." : "Submit new issue"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-cancel ml-2"
                    onClick={() => navigate("/issues")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Issues;
