import React, { useState } from "react";

function EditProfile() {
  const [formData, setFormData] = useState({
    name: "sitin",
    email: "sitin@gmail.com",
    role: "User",
    company: "ABC Sdn Bhd",
    contact: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("✅ Profile updated successfully (demo only).");
  };

  return (
    // <div className="max-w-xl mx-auto mt-8 bg-white shadow-lg rounded-2xl p-6">
    <div className="p-6 space-y-8 bg-white rounded-xl shadow-md">
      {/* <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1> */}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Name */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
            required
          />
        </div>

        {/* Email */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
            required
          />
        </div>

        {/* Role */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
            required
          />
        </div>

        {/* Company */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
            required
          />
        </div>

        {/* Contact */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">Contact No</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Enter contact number"
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Password */}
        <div className ="flex items-center space-x-4">
          <label className="w-40 block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            className="flex-1 max-w-2xl px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end mt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </div>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}

export default EditProfile;
