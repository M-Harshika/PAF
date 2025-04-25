import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onNavigateToRegister }) {
  const navigate = useNavigate();

  onNavigateToRegister = onNavigateToRegister || (() => navigate("/register"));

  const [formData, setFormData] = useState({
    userId: "",
    email: "",
    password: "",
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

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json(); // Parse JSON instead of .text()

      if (response.ok) {
        // Destructure the object and exclude password
        const { password, ...userWithoutPassword } = result;

        // Save to localStorage
        localStorage.setItem("loggedUser", JSON.stringify(userWithoutPassword));

        navigate("/dashboard");
      } else {
        alert(result.message || "Login failed");
      }
    } catch (error) {
      alert("Login failed. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <h1 className="form-title">Login to Your Account</h1>

          <form onSubmit={handleSubmit} className="login-form">
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

            <div className="form-footer">
              <button type="submit" className="submit-button">
                Login
              </button>
            </div>
          </form>

          <div className="form-links">
            <p>
              Don't have an account?{" "}
              <button onClick={onNavigateToRegister} className="link-button">
                Register
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          padding: 20px;
        }

        .login-container {
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

        .login-form {
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
