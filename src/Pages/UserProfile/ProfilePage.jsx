import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trash,
  Edit,
  MessageCircle,
  Heart,
  Save,
  X,
  ArrowLeft,
} from "lucide-react";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [UFPosts, setUFPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editMediaFiles, setEditMediaFiles] = useState([]);
  const [editMediaUrls, setEditMediaUrls] = useState([]);
  const [userData, setUserData] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem("loggedUser"));
  const userId = loggedInUser?.id;

  useEffect(() => {
    if (!userId) {
      setError("User not logged in.");
      setIsLoading(false);
      return;
    }

    fetchUserData();
    fetchUserPosts();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/user/${userId}`
      );
      setUserData(response.data);
    } catch (err) {
      setError("Failed to fetch user data.");
      console.error(err);
    }
  };

  const fetchUserPosts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/posts/user/${userId}`
      );
      setUFPosts(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load posts.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`http://localhost:8080/api/posts/${postId}`);
        setUFPosts(UFPosts.filter((post) => post.id !== postId));
      } catch (err) {
        alert("Failed to delete post.");
        console.error(err);
      }
    }
  };

  const startEditing = (post) => {
    setEditingPost(post.id);
    setEditContent(post.description || "");
    setEditMediaUrls(post.mediaUrls || []);
    setEditMediaFiles([]);
    setFormErrors({});
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent("");
    setEditMediaFiles([]);
    setEditMediaUrls([]);
    setFormErrors({});
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert("You can upload a maximum of 3 files");
      return;
    }
    const validFiles = files.filter((file) =>
      file.type.match(/^image\/(jpe?g|png|gif)|video\/(mp4|webm)$/)
    );
    if (validFiles.length !== files.length) {
      alert(
        "Please select valid image (JPEG, PNG, GIF) or video (MP4, WebM) files"
      );
      return;
    }
    const base64Promises = validFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(base64Promises)
      .then((base64Urls) => {
        setEditMediaFiles(validFiles);
        setEditMediaUrls(base64Urls);
      })
      .catch((err) => {
        alert("Error converting files to Base64");
        console.error(err);
      });
  };

  const validatePostForm = () => {
    const errors = {};
    if (!editContent.trim()) errors.content = "Description is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveEdit = async (postId) => {
    if (!validatePostForm()) return;
    try {
      const updatedPost = {
        description: editContent,
        mediaUrls: editMediaUrls,
      };
      const response = await axios.put(
        `http://localhost:8080/api/posts/${postId}`,
        updatedPost
      );
      setUFPosts(
        UFPosts.map((post) => (post.id === postId ? response.data : post))
      );
      cancelEditing();
    } catch (err) {
      alert("Failed to update post.");
      console.error(err);
    }
  };

  const addLike = async (postId) => {
    try {
      await axios.post(`http://localhost:8080/api/posts/${postId}/likes`, {
        userId,
      });
      fetchUserPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const removeLike = async (postId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/posts/${postId}/likes/${userId}`
      );
      fetchUserPosts();
    } catch (err) {
      console.error("Error removing like:", err);
    }
  };

  const isPostLiked = (post) =>
    post.likes && post.likes.some((like) => like.userId === userId);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const isImageUrl = (url) => {
    if (url.startsWith("data:")) {
      return url.startsWith("data:image/");
    }
    return url.match(/\.(jpeg|jpg|png|gif)$/i);
  };

  const isVideoUrl = (url) => {
    if (url.startsWith("data:")) {
      return url.startsWith("data:video/");
    }
    return url.match(/\.(mp4|webm)$/i);
  };

  const renderPostContent = (post) => {
    if (editingPost === post.id) {
      return (
        <div className="edit-form">
          <div className="form-group">
            <label
              htmlFor={`post-description-${post.id}`}
              className="form-label"
            >
              Description <span className="required">*</span>
            </label>
            <textarea
              id={`post-description-${post.id}`}
              className="edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              placeholder="Enter post description"
              aria-required="true"
            />
            {formErrors.content && (
              <span className="error-text">{formErrors.content}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Upload Images or Videos (up to 3)
            </label>
            <input
              type="file"
              id={`edit-media-files-${post.id}`}
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
              multiple
              onChange={handleEditFileChange}
              className="file-input"
              aria-describedby="file-help"
            />
            <small id="file-help" className="form-help">
              JPEG, PNG, GIF, MP4, or WebM only
            </small>
          </div>
          {editMediaUrls.length > 0 && (
            <div className="media-previews">
              {editMediaUrls.map((url, index) => (
                <div key={index} className="media-preview">
                  {isImageUrl(url) ? (
                    <img src={url} alt={`Preview ${index + 1}`} />
                  ) : isVideoUrl(url) ? (
                    <video controls>
                      <source
                        src={url}
                        type={url.includes("mp4") ? "video/mp4" : "video/webm"}
                      />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <p>Unsupported media type</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="cancel-button" onClick={cancelEditing}>
              <X size={18} /> Cancel
            </button>
            <button className="save-button" onClick={() => saveEdit(post.id)}>
              <Save size={18} /> Save
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <p className="post-content">{post.description}</p>
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="post-media">
            {post.mediaUrls.map((url, index) => (
              <div key={index} className="media-item">
                {isImageUrl(url) ? (
                  <img
                    src={url}
                    alt={`Post Media ${index + 1}`}
                    className="post-image"
                  />
                ) : isVideoUrl(url) ? (
                  <video controls className="post-video">
                    <source
                      src={url}
                      type={url.includes("mp4") ? "video/mp4" : "video/webm"}
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <p>Unsupported media type</p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderPosts = () => {
    if (isLoading)
      return <div className="loading-message">Loading posts...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (UFPosts.length === 0)
      return <div className="empty-message">No posts found.</div>;

    return (
      <div className="posts-container">
        {UFPosts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-info">
                <h3 className="post-title">
                  {post.description || "Untitled Post"}
                </h3>
                <p className="post-date">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              {post.userId === userId && (
                <div className="post-actions">
                  <button
                    onClick={() => startEditing(post)}
                    className="action-button edit-button"
                    disabled={editingPost === post.id}
                    aria-label="Edit post"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="action-button delete-button"
                    aria-label="Delete post"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              )}
            </div>
            {renderPostContent(post)}
            <div className="post-footer">
              <button
                className={`like-button ${isPostLiked(post) ? "liked" : ""}`}
                onClick={() =>
                  isPostLiked(post) ? removeLike(post.id) : addLike(post.id)
                }
                aria-label={isPostLiked(post) ? "Unlike post" : "Like post"}
              >
                <Heart
                  size={18}
                  className="like-icon"
                  fill={isPostLiked(post) ? "currentColor" : "none"}
                />
                <span>{post.likes ? post.likes.length : 0}</span>
              </button>
              <div className="comment-count">
                <MessageCircle size={18} className="comment-icon" />
                <span>{post.comments ? post.comments.length : 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-navigation">
          <button
            className="back-button"
            onClick={handleBackToDashboard}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
        <div className="profile-header">
          <div className="profile-avatar">
            {userData?.profileImage ? (
              <img src={userData.profileImage} alt="Profile" />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Default Profile"
              />
            )}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{userData?.name || "My Profile"}</h2>
            <p className="profile-username">{userData?.email || "username"}</p>
          </div>
        </div>
        <h3 className="section-title">My Posts</h3>
        {renderPosts()}
      </div>
    </div>
  );
};

export default ProfilePage;
