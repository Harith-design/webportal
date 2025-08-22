import React, { useState } from "react";
import "./AuthOrder.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard";
      } else setMessage("❌ " + (data.message || "Login failed"));
    } catch (error) {
      setMessage("⚠️ " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-dark-gradient overflow-hidden p-8">
      {/* Floating particles */}
      <div className="absolute w-48 h-48 bg-gold/30 rounded-full animate-float top-20 left-10"></div>
      <div className="absolute w-64 h-64 bg-gold/20 rounded-full animate-float-slow bottom-10 right-20"></div>

      <form className="relative login-glass-card p-8 text-white" onSubmit={handleSubmit}>
        <h2 className="text-4xl font-bold mb-6 text-center text-neon-purple">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="glass-input mb-4 w-full"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="glass-input mb-4 w-full"
          required
        />

        <button type="submit" className="btn-submit w-full mb-4">Login</button>

        {message && <p className="mt-3 text-center text-green-400">{message}</p>}

        <p className="text-center text-gray-300 mt-2">
          Don't have an account? <a href="/signup" className="text-neon-purple hover:underline">Sign Up</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
