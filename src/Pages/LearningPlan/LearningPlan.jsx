import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LearningPlan.css";

const API_BASE_URL = "http://localhost:8080/api";

export default function LearningPlan() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [learningPlans, setLearningPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLearningPlan, setNewLearningPlan] = useState({
    title: "",
    description: "",
    topics: "",
    resources: "",
  });
  const [newCourse, setNewCourse] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
    fetchLearningPlans();
  }, [navigate]);

  const fetchLearningPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/learning-plan`);
      setLearningPlans(response.data);
    } catch (err) {
      setError("Failed to fetch learning plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLearningPlan({
      ...newLearningPlan,
      [name]: value,
    });
  };

  const handleLearningPlanSubmit = async (e) => {
    e.preventDefault();
    if (!newLearningPlan.title.trim() || !newLearningPlan.description.trim()) {
      alert("Please add a title and description");
      return;
    }
    try {
      const planData = {
        userId: user.id,
        userName: user.name,
        title: newLearningPlan.title,
        description: newLearningPlan.description,
        topics: newLearningPlan.topics,
        resources: newLearningPlan.resources,
      };
      const response = await axios.post(
        `${API_BASE_URL}/learning-plan/user/${user.id}`,
        planData
      );
      setLearningPlans([response.data, ...learningPlans]);
      setNewLearningPlan({
        title: "",
        description: "",
        topics: "",
        resources: "",
      });
    } catch (err) {
      setError("Failed to create learning plan");
      console.error(err);
    }
  };

  const handleCourseInputChange = (planId, value) => {
    setNewCourse({
      ...newCourse,
      [planId]: value,
    });
  };

  const handleEnrollCourse = async (planId) => {
    const courseName = newCourse[planId];
    if (!courseName || !courseName.trim()) {
      alert("Please enter a course name");
      return;
    }
    try {
      const courseData = {
        courseId: `course-${Date.now()}`,
        courseName: courseName,
        completed: false,
        enrolledAt: new Date(),
      };
      const response = await axios.post(
        `${API_BASE_URL}/learning-plan/${planId}/courses`,
        courseData
      );
      setLearningPlans(
        learningPlans.map((plan) => (plan.id === planId ? response.data : plan))
      );
      setNewCourse({ ...newCourse, [planId]: "" });
    } catch (err) {
      setError("Failed to enroll in course");
      console.error(err);
    }
  };

  const handleRemoveCourse = async (planId, courseId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/learning-plan/${planId}/courses/${courseId}`
      );
      setLearningPlans(
        learningPlans.map((plan) => (plan.id === planId ? response.data : plan))
      );
    } catch (err) {
      setError("Failed to remove course");
      console.error(err);
    }
  };

  const handleMarkCourseCompleted = async (planId, courseId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/learning-plan/${planId}/courses/${courseId}/complete`
      );
      setLearningPlans(
        learningPlans.map((plan) => (plan.id === planId ? response.data : plan))
      );
    } catch (err) {
      setError("Failed to mark course as completed");
      console.error(err);
    }
  };

  return (
    <div className="learning-plan-page">
      <header className="page-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
          Back to Dashboard
        </button>
        <h1>Learning Plans</h1>
      </header>

      <div className="plan-create-section">
        <h2>Create Your Learning Plan</h2>
        <form onSubmit={handleLearningPlanSubmit} className="plan-form">
          <div className="input-group">
            <label className="input-label" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Give your learning plan a descriptive title"
              value={newLearningPlan.title}
              onChange={handleInputChange}
              className="plan-input"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your learning plan in detail..."
              value={newLearningPlan.description}
              onChange={handleInputChange}
              className="plan-textarea"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="topics">
              Topics
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              placeholder="Topics to cover (comma separated)"
              value={newLearningPlan.topics}
              onChange={handleInputChange}
              className="plan-input"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="resources">
              Resources
            </label>
            <input
              type="text"
              id="resources"
              name="resources"
              placeholder="Learning resources (books, courses, websites, etc.)"
              value={newLearningPlan.resources}
              onChange={handleInputChange}
              className="plan-input"
            />{" "}
          </div>
          <button type="submit" className="plan-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            Create Learning Plan
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
          </svg>
          {error}
        </div>
      )}

      <div className="learning-plans-section">
        <div className="section-header">
          <h2>Your Learning Plans</h2>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading learning plans...</span>
          </div>
        ) : learningPlans.length === 0 ? (
          <div className="no-plans">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="#6b7280"
              viewBox="0 0 16 16"
              style={{ marginBottom: "15px" }}
            >
              <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
              <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
            </svg>
            <p>No learning plans yet. Create your first plan!</p>
          </div>
        ) : (
          <div className="learning-plans-grid">
            {learningPlans.map((plan) => (
              <div key={plan.id} className="plan-card">
                <div className="plan-header">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="Profile"
                    className="plan-user-icon"
                  />
                  <div className="plan-user-info">
                    <span className="plan-username">{plan.userName}</span>
                    <span className="plan-time">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="plan-content-container">
                  <h3 className="plan-title">{plan.title}</h3>
                  <p className="plan-content">{plan.description}</p>
                  {(plan.topics || plan.resources) && (
                    <div className="plan-meta">
                      {plan.topics && (
                        <div className="plan-detail">
                          <strong>Topics:</strong> {plan.topics}
                        </div>
                      )}
                      {plan.resources && (
                        <div className="plan-detail">
                          <strong>Resources:</strong> {plan.resources}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="progress-section">
                    <h4>Progress: {Math.round(plan.progress)}%</h4>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                    {plan.badges && plan.badges.length > 0 && (
                      <div className="badges">
                        <h4>Achievements:</h4>
                        <div className="badge-list">
                          {plan.badges.map((badge, index) => (
                            <span
                              key={index}
                              className={`badge badge-${badge.toLowerCase()}`}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="courses-section">
                    <h4>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z" />
                      </svg>
                      Enrolled Courses ({plan.enrolledCourses?.length || 0})
                    </h4>
                    {plan.userId === user?.id && (
                      <div className="add-course">
                        <input
                          type="text"
                          placeholder="Add a course..."
                          value={newCourse[plan.id] || ""}
                          onChange={(e) =>
                            handleCourseInputChange(plan.id, e.target.value)
                          }
                          className="course-input"
                        />
                        <button
                          className="course-button"
                          onClick={() => handleEnrollCourse(plan.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                          </svg>
                          Enroll
                        </button>
                      </div>
                    )}
                    <div className="courses-list">
                      {plan.enrolledCourses &&
                      plan.enrolledCourses.length > 0 ? (
                        plan.enrolledCourses.map((course) => (
                          <div key={course.courseId} className="course-item">
                            <div className="course-info">
                              <span className="course-name">
                                {course.courseName}
                              </span>
                              <span className="course-status">
                                {course.completed ? "Completed" : "In Progress"}
                              </span>
                            </div>
                            {plan.userId === user?.id && (
                              <div className="course-actions">
                                {!course.completed && (
                                  <button
                                    className="complete-course"
                                    onClick={() =>
                                      handleMarkCourseCompleted(
                                        plan.id,
                                        course.courseId
                                      )
                                    }
                                  >
                                    Mark as Completed
                                  </button>
                                )}
                                <button
                                  className="remove-course"
                                  onClick={() =>
                                    handleRemoveCourse(plan.id, course.courseId)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                  >
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-courses">
                          <p>No courses enrolled yet.</p>
                        </div>
                      )}
                    </div>
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
