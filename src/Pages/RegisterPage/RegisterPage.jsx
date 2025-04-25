import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage({ onNavigateToLogin }) {
  const navigate = useNavigate();

  onNavigateToLogin = onNavigateToLogin || (() => navigate("/login"));

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.text();

      alert(result);

      if (response.ok && result === "User registered successfully") {
        navigate("/login");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="form-container">
          <h1 className="form-title">Create an Account</h1>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-footer">
              <button type="submit" className="submit-button">
                Register
              </button>
            </div>
          </form>

          <div className="form-links">
            <p>
              Already have an account?{" "}
              <button onClick={onNavigateToLogin} className="link-button">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          padding: 20px;
        }
        
        .register-container {
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
        }
        
        .form-container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .form-title {
          color: #111827;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .register-form {
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          color: #4b5563;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-footer {
          margin-top: 24px;
        }
        
        .submit-button {
          width: 100%;
          background-color: #3b82f6;
          margin-left: 0;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-button:hover {
          background-color: #2563eb;
        }
        
        .form-links {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        
        .link-button {
          background: none;
          border: none;
          color: #3b82f6;
          padding: 0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
        }
        
        .link-button:hover {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
