import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "./dashboard.css"; // Reuse dashboard styles

const CreateRepository = () => {
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true); // true = Public, false = Private
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      try {
        const { data } = await axios.get(`http://localhost:3000/userProfile/${userId}`);
        if (data && data.username) {
          setUsername(data.username);
        }
      } catch (e) {
        console.error("Error fetching user profile:", e);
      }
    };
    fetchUserProfile();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) {
      setErrorMsg("Repository name is required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.post("http://localhost:3000/repo/create", {
        owner: userId,
        name: repoName.trim(),
        description: description.trim(),
        visibility: visibility,
        content: [],
        issues: []
      });

      if (res.status === 201) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to create repository.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <div className="create-repo-page">
        <div className="create-repo-container">
          <div className="create-repo-header border-bottom">
            <h1 className="create-repo-title">Create a new repository</h1>
            <p className="create-repo-subtitle">
              A repository contains all project files, including the revision history. Already have a project repository elsewhere? <a href="#">Import a repository.</a>
            </p>
          </div>

          {errorMsg && (
            <div className="error-banner">
              <span>{errorMsg}</span>
              <button className="close-banner-btn" onClick={() => setErrorMsg("")}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-repo-form">
            <div className="form-row">
              <div className="form-group owner-group">
                <label className="form-label">Owner *</label>
                <div className="owner-select-badge">
                  <span className="owner-avatar-circle">
                    {(username || "U")[0].toUpperCase()}
                  </span>
                  <span className="owner-name-display">{username || "Loading..."}</span>
                </div>
              </div>
              
              <span className="repo-slash-separator">/</span>

              <div className="form-group name-group">
                <label htmlFor="repoName" className="form-label">Repository name *</label>
                <input
                  type="text"
                  id="repoName"
                  placeholder="e.g. special-fortnight"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  required
                  className="repo-name-input-field"
                />
              </div>
            </div>

            <p className="repo-name-hint">
              Great repository names are short and memorable. Need inspiration? How about <span className="suggestion-highlight">improved-waddle</span>?
            </p>

            <div className="form-group mt-3">
              <label htmlFor="description" className="form-label">
                Description <span className="text-muted">(optional)</span>
              </label>
              <input
                type="text"
                id="description"
                placeholder="Description of this repository"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="repo-desc-input-field"
              />
            </div>

            <div className="visibility-section border-top-group mt-4">
              <div className="visibility-options-list">
                <label className="visibility-option-item">
                  <input
                    type="radio"
                    name="repoVisibility"
                    checked={visibility === true}
                    onChange={() => setVisibility(true)}
                    className="visibility-radio"
                  />
                  <div className="visibility-desc-block">
                    <span className="visibility-option-title">
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="visibility-icon-svg">
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.5-3.25V7h1.25a.75.75 0 0 1 0 1.5H9v2.25a.75.75 0 0 1-1.5 0V8.5H6.25a.75.75 0 0 1 0-1.5H7.5V4.75a.75.75 0 0 1 1.5 0Z"></path>
                      </svg>
                      Public
                    </span>
                    <span className="visibility-option-desc">
                      Anyone on the internet can see this repository. You choose who can commit.
                    </span>
                  </div>
                </label>

                <label className="visibility-option-item">
                  <input
                    type="radio"
                    name="repoVisibility"
                    checked={visibility === false}
                    onChange={() => setVisibility(false)}
                    className="visibility-radio"
                  />
                  <div className="visibility-desc-block">
                    <span className="visibility-option-title">
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor" className="visibility-icon-svg">
                        <path d="M4 5.5a4 4 0 0 1 8 0v2H4v-2zM3 7.5V11c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V7.5H3zM2 5.5a6 6 0 0 1 12 0v2h.75c.69 0 1.25.56 1.25 1.25v4.5c0 .69-.56 1.25-1.25 1.25H1.25A1.25 1.25 0 0 1 0 13.25v-4.5C0 8.06.56 7.5 1.25 7.5H2v-2z"></path>
                      </svg>
                      Private
                    </span>
                    <span className="visibility-option-desc">
                      You choose who can see and commit to this repository.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-submit-section border-top-group mt-4">
              <button
                type="submit"
                className="btn btn-primary create-repo-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating repository..." : "Create repository"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateRepository;
