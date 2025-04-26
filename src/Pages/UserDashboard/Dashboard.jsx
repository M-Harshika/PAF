import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const fetchNotifications = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(
        `http://localhost:8080/api/notifications?userId=${user.id}`,
        getAuthHeaders()
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(
        `http://localhost:8080/api/notifications/unread?userId=${user.id}`,
        getAuthHeaders()
      );
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/profile/all`,
        getAuthHeaders()
      );
      const currentUser = JSON.parse(localStorage.getItem("loggedUser"));
      setUsers(
        response.data
          .filter((u) => u.id !== currentUser.id)
          .map((u) => ({
            ...u,
            isFollowing: currentUser.following?.includes(u.id) || false,
          }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
    setLoadingUsers(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/profile/search?email=${searchQuery}`,
        getAuthHeaders()
      );
      const currentUser = JSON.parse(localStorage.getItem("loggedUser"));
      setUsers(
        response.data
          .filter((u) => u.id !== currentUser.id)
          .map((u) => ({
            ...u,
            isFollowing: currentUser.following?.includes(u.id) || false,
          }))
      );
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    }
    setLoadingUsers(false);
  };

  const handleFollow = async (followeeId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/profile/follow/${user.id}/${followeeId}`,
        {},
        getAuthHeaders()
      );
      toast.success(response.data);
      setUsers(
        users.map((u) =>
          u.id === followeeId ? { ...u, isFollowing: true } : u
        )
      );
      // Update localStorage to reflect new following status
      const updatedUser = {
        ...user,
        following: [...(user.following || []), followeeId],
      };
      localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error following user:", error);
      toast.error(error.response?.data || "Failed to follow user");
    }
  };

  const handleUnfollow = async (followeeId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/profile/unfollow/${user.id}/${followeeId}`,
        {},
        getAuthHeaders()
      );
      toast.success(response.data);
      setUsers(
        users.map((u) =>
          u.id === followeeId ? { ...u, isFollowing: false } : u
        )
      );
      // Update localStorage to reflect new following status
      const updatedUser = {
        ...user,
        following: (user.following || []).filter((id) => id !== followeeId),
      };
      localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error(error.response?.data || "Failed to unfollow user");
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchNotifications();
      fetchUnreadCount();
      fetchUsers();
      const intervalId = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {},
        getAuthHeaders()
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((notif) => !notif.read);
      await Promise.all(
        unreadNotifications.map((notif) =>
          axios.put(
            `http://localhost:8080/api/notifications/${notif.id}/read`,
            {},
            getAuthHeaders()
          )
        )
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const capitalizeName = (name) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="dashboard-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="dashboard-header">
        <div className="profile-area">
          <div className="avatar-container">
            <img
              src={
                user?.profileImage ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="Profile"
              className="profile-icon"
            />
          </div>
          <span className="username">
            {user ? `Welcome, ${capitalizeName(user.name)}` : "Loading..."}
          </span>
        </div>

        <div className="action-buttons">
          <div className="notification-wrapper">
            <button
              className="notification-button"
              onClick={toggleNotifications}
            >
              <Bell className="notification-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${
                          notification.read ? "read" : "unread"
                        }`}
                        onClick={() =>
                          !notification.read && markAsRead(notification.id)
                        }
                      >
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-notifications">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2 className="dashboard-title">Your skillHive Dashboard</h2>

        <div className="dashboard-grid">
          <div
            className="card skill-sharing"
            onClick={() => navigate("/skill-sharing")}
          >
            <div className="card-icon">📷</div>
            <div className="card-content">
              <h3>Posts</h3>
              <p>Share photos, videos, and tips with the community.</p>
            </div>
          </div>

          <div
            className="card learning-plan"
            onClick={() => navigate("/learning-plan")}
          >
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Learning Plans</h3>
              <p>Create and update your structured learning journey.</p>
            </div>
          </div>

          <div
            className="card profile"
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            <div className="card-icon">👤</div>
            <div className="card-content">
              <h3>Profile</h3>
              <p>View your skill posts, plans, and followers.</p>
            </div>
          </div>
        </div>

        <div className="user-discovery-section">
          <h2 className="section-title">Discover Users</h2>
          <form onSubmit={handleSearch} className="user-search-form">
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-search-input"
            />
            <button type="submit" className="user-search-button">
              Search
            </button>
          </form>
          <div className="user-list">
            {loadingUsers ? (
              <p className="loading-text">Loading users...</p>
            ) : users.length > 0 ? (
              users.map((u) => (
                <div key={u.id} className="user-item">
                  <div className="user-info">
                    <img
                      src={
                        u.profileImage ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      }
                      alt="User profile"
                      className="user-icon"
                    />
                    <div className="user-details">
                      <span
                        className="user-name"
                      >
                        {capitalizeName(u.name)}
                      </span>
                      <span className="user-email">{u.email}</span>
                    </div>
                  </div>
                  <button
                    className={`follow-button ${
                      u.isFollowing ? "following" : ""
                    }`}
                    onClick={() =>
                      u.isFollowing ? handleUnfollow(u.id) : handleFollow(u.id)
                    }
                  >
                    {u.isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>
              ))
            ) : (
              <p className="no-users">No users found.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
