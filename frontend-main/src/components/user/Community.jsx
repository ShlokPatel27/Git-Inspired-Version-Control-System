import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../Navbar";
import "./community.css";

const Community = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/allUsers`);
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    if (userId) {
      const storedFollowed = JSON.parse(localStorage.getItem(`mygit_follows_${userId}`)) || [];
      setFollowedIds(storedFollowed);
    }
  }, [userId]);

  const toggleFollowUser = (targetUserId) => {
    if (!userId) return;
    let updatedFollowed = [...followedIds];
    if (updatedFollowed.includes(targetUserId)) {
      updatedFollowed = updatedFollowed.filter((id) => id !== targetUserId);
    } else {
      updatedFollowed.push(targetUserId);
    }
    setFollowedIds(updatedFollowed);
    localStorage.setItem(`mygit_follows_${userId}`, JSON.stringify(updatedFollowed));
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Navbar />
      <div className="community-page">
        <div className="community-container">
          <div className="community-header border-bottom">
            <h1 className="community-title">Explore MyGit Community</h1>
            <p className="community-subtitle">
              Connect and follow developer peers using MyGit.
            </p>
          </div>

          <div className="community-search-bar mt-3">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="community-search-input"
            />
          </div>

          {loading ? (
            <div className="community-loading text-muted mt-4">Loading users...</div>
          ) : (
            <div className="community-grid mt-4">
              {filteredUsers.length === 0 ? (
                <div className="community-empty text-muted">No users found.</div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user._id === userId;
                  const isFollowing = followedIds.includes(user._id);

                  return (
                    <div key={user._id} className="community-user-card">
                      <div className="user-card-info">
                        <div className="user-card-avatar">
                          {(user.username || "U")[0].toUpperCase()}
                        </div>
                        <div className="user-card-details">
                          <span className="user-card-username">
                            {user.username || "username"}
                            {isSelf && <span className="self-badge">You</span>}
                          </span>
                          <span className="user-card-email text-muted">
                            {user.email || "email@domain.com"}
                          </span>
                        </div>
                      </div>

                      {!isSelf && (
                        <button
                          onClick={() => toggleFollowUser(user._id)}
                          className={`btn btn-sm ${isFollowing ? "btn-unfollow" : "btn-primary"}`}
                        >
                          {isFollowing ? "Unfollow" : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Community;
