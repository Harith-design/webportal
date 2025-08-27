import React, { useState } from "react";
import { register } from "../services/api"; // ✅ use the new api.js
import "./Signup.css";

function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await register(formData); // ✅ call register()

      // save token to localStorage
      localStorage.setItem("token", response.data.token);

      setMessage("✅ Registration successful!");
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage("❌ " + (error.response.data.message || "Registration failed"));
      } else {
        setMessage("⚠️ " + error.message);
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>

          <input
            type="text"
            name="name"
            placeholder="Username"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password_confirmation"
            placeholder="Confirm Password"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />

          <button type="submit">Create Account</button>

          {message && <p className="message">{message}</p>}

          <p className="login-link">
            Already have an account? <a href="/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
