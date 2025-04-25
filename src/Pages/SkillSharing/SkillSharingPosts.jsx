import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash, Edit } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SkillSharingPosts.css";

const API_BASE_URL = "http://localhost:8080/api";

export default function SkillSharingPosts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({
    description: "",
    mediaFiles: [],
    mediaUrls: [],
  });
  const [comments, setComments] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }

    fetchPosts();
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/posts`,
        getAuthHeaders()
      );
      setPosts(response.data);
    } catch (err) {
      handleError(err, "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err, defaultMessage) => {
    if (err.response?.status === 401) {
      setError("Session expired. Please log in again.");
      localStorage.removeItem("loggedUser");
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setError(err.response?.data?.message || defaultMessage);
    }
    console.error(err);
  };

  const validateVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 30); // Max 30 seconds
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 3) {
      toast.error("You can upload a maximum of 3 files (photos or videos)");
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      if (file.type.match(/^image\/(jpe?g|png|gif)$/)) {
        validFiles.push(file);
      } else if (file.type.match(/^video\/(mp4|webm|ogg)$/)) {
        const isValidDuration = await validateVideoDuration(file);
        if (isValidDuration) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
        }
      } else {
        invalidFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(
        "Please select valid files (JPEG, PNG, GIF, MP4, WebM, or OGG videos up to 30 seconds)"
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
        setNewPost({
          ...newPost,
          mediaFiles: validFiles,
          mediaUrls: base64Urls,
        });
      })
      .catch((err) => {
        toast.error("Error converting files");
        console.error(err);
      });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!newPost.description.trim() && newPost.mediaUrls.length === 0) {
      toast.error("Please add a description or at least one file");
      return;
    }

    try {
      const postData = {
        userId: user.id,
        userName: user.name,
        description: newPost.description,
        mediaUrls: newPost.mediaUrls,
      };

      const response = await axios.post(
        `${API_BASE_URL}/posts/user/${user.id}`,
        postData,
        getAuthHeaders()
      );
      setPosts([response.data, ...posts]);
      setNewPost({
        description: "",
        mediaFiles: [],
        mediaUrls: [],
      });
      toast.success("Post shared successfully!");
    } catch (err) {
      handleError(err, "Failed to create post");
    }
  };

  const handleCommentChange = (postId, value) => {
    setComments({
      ...comments,
      [postId]: value,
    });
  };

  const handleAddComment = async (postId) => {
    if (!comments[postId] || !comments[postId].trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const commentData = {
        userId: user.id,
        userName: user.name,
        content: comments[postId],
      };

      const response = await axios.post(
        `${API_BASE_URL}/posts/${postId}/comments`,
        commentData,
        getAuthHeaders()
      );

      setPosts(
        posts.map((post) => (post.id === postId ? response.data : post))
      );
      setComments({ ...comments, [postId]: "" });
      toast.success("Comment added!");
      // Notify post owner (handled by backend)
    } catch (err) {
      handleError(err, "Failed to add comment");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/posts/${postId}/comments/${commentId}?userId=${user.id}`,
        getAuthHeaders()
      );
      setPosts(
        posts.map((post) => (post.id === postId ? response.data : post))
      );
      toast.success("Comment deleted!");
    } catch (err) {
      handleError(err, "Failed to delete comment");
    }
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find((p) => p.id === postId);
      const alreadyLiked =
        post.likes && post.likes.some((like) => like.userId === user.id);

      let response;
      if (alreadyLiked) {
        response = await axios.delete(
          `${API_BASE_URL}/posts/${postId}/likes/${user.id}`,
          getAuthHeaders()
        );
        toast.success("Like removed!");
      } else {
        const likeData = {
          userId: user.id,
        };
        response = await axios.post(
          `${API_BASE_URL}/posts/${postId}/likes`,
          likeData,
          getAuthHeaders()
        );
        toast.success("Post liked!");
        // Notify post owner (handled by backend)
      }

      setPosts(
        posts.map((post) => (post.id === postId ? response.data : post))
      );
    } catch (err) {
      handleError(err, "Failed to update like");
    }
  };

  const handleUpdateComment = async (postId, commentId, updatedContent) => {
    if (updatedContent === null || !updatedContent.trim()) {
      toast.error(
        updatedContent === null
          ? "Comment update cancelled"
          : "Comment cannot be empty"
      );
      return;
    }

    try {
      const updatedCommentData = { content: updatedContent };
      const response = await axios.put(
        `${API_BASE_URL}/posts/${postId}/comments/${commentId}`,
        updatedCommentData,
        getAuthHeaders()
      );

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId
                    ? { ...comment, content: updatedContent }
                    : comment
                ),
              }
            : post
        )
      );
      toast.success("Comment updated!");
    } catch (err) {
      handleError(err, "Failed to update comment");
    }
  };

  const isPostLikedByUser = (post) => {
    return post.likes && post.likes.some((like) => like.userId === user?.id);
  };

  return (
    <div className="skill-sharing-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="page-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1>Posts</h1>
      </header>

      <div className="post-create-section">
        <h2>Share Your Post</h2>
        <form onSubmit={handlePostSubmit} className="post-form">
          <textarea
            placeholder="Describe what you're sharing..."
            value={newPost.description}
            onChange={(e) =>
              setNewPost({ ...newPost, description: e.target.value })
            }
            className="post-textarea"
          />

          <div className="media-upload">
            <label htmlFor="media-files" className="media-label">
              Add Up to 3 Photos or Videos (max 30s)
            </label>
            <input
              type="file"
              id="media-files"
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {newPost.mediaUrls.length > 0 && (
            <div className="media-previews">
              {newPost.mediaUrls.map((url, index) => (
                <div key={index} className="media-preview">
                  {newPost.mediaFiles[index].type.startsWith("image") ? (
                    <img src={url} alt="Preview" />
                  ) : (
                    <video src={url} controls muted className="preview-video" />
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="submit" className="post-button">
            Share Post
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="posts-section">
        <h2>Community Posts</h2>

        {loading && <div className="loading-spinner">Loading...</div>}

        {posts.length === 0 && !loading ? (
          <div className="no-posts">No posts yet. Be the first to share!</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="Profile"
                    className="post-user-icon"
                  />
                  <div className="post-user-info">
                    <span className="post-username">{post.userName}</span>
                    <span className="post-time">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="post-description">{post.description}</p>

                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="post-media">
                    {post.mediaUrls.map((url, index) => (
                      <div key={index} className="media-item">
                        {url.includes("video") ? (
                          <video
                            src={url}
                            controls
                            muted
                            className="post-video"
                          />
                        ) : (
                          <img src={url} alt="Post media" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <button
                    className={`like-button ${
                      isPostLikedByUser(post) ? "liked" : ""
                    }`}
                    onClick={() => handleLike(post.id)}
                  >
                    {isPostLikedByUser(post) ? "❤️" : "🤍"}{" "}
                    {post.likes?.length || 0}{" "}
                    {post.likes?.length === 1 ? "Like" : "Likes"}
                  </button>
                </div>

                <div className="comments-section">
                  <h4>Comments ({post.comments?.length || 0})</h4>

                  <div className="add-comment">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={comments[post.id] || ""}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      className="comment-input"
                    />
                    <button
                      className="comment-button"
                      onClick={() => handleAddComment(post.id)}
                    >
                      Add Comment
                    </button>
                  </div>

                  <div className="comments-list">
                    {post.comments &&
                      post.comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <p className="comment-author">
                            {comment.userName}:{" "}
                            <span className="comment-content">
                              {comment.content}
                            </span>
                          </p>
                          {(comment.userId === user?.id ||
                            post.userId === user?.id) && (
                            <div className="comment-actions">
                              <button
                                className="delete-comment"
                                onClick={() =>
                                  handleDeleteComment(post.id, comment.id)
                                }
                              >
                                <Trash size={18} />
                              </button>
                              {comment.userId === user?.id && (
                                <button
                                  className="update-comment"
                                  onClick={() =>
                                    handleUpdateComment(
                                      post.id,
                                      comment.id,
                                      prompt(
                                        "Update your comment",
                                        comment.content
                                      )
                                    )
                                  }
                                >
                                  <Edit size={18} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
