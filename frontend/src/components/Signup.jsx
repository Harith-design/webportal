import React, { useState } from "react";
import "./AuthOrder.css";

function SignUp() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) setMessage("✅ Registration successful!");
      else setMessage("❌ " + (data.message || "Registration failed"));
    } catch (error) {
      setMessage("⚠️ " + error.message);
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-dark-gradient overflow-hidden p-8">
      {/* Floating particles */}
      <div className="absolute w-48 h-48 bg-gold/30 rounded-full animate-float top-20 left-10"></div>
      <div className="absolute w-64 h-64 bg-gold/20 rounded-full animate-float-slow bottom-10 right-20"></div>

      <form className="relative signup-glass-card p-8 text-white" onSubmit={handleSubmit}>
        <h2 className="text-4xl font-bold mb-6 text-center text-neon-purple">Sign Up</h2>

        <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="glass-input mb-4 w-full" required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="glass-input mb-4 w-full" required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="glass-input mb-4 w-full" required />
        <input type="password" name="password_confirmation" placeholder="Confirm Password" value={formData.password_confirmation} onChange={handleChange} className="glass-input mb-4 w-full" required />

        <button type="submit" className="btn-submit w-full mb-4">Register</button>

        {message && <p className="mt-3 text-center text-green-400">{message}</p>}

        <p className="text-center text-gray-300 mt-2">
          Already have an account? <a href="/login" className="text-neon-purple hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
}

export default SignUp;
