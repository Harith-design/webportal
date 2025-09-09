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
    <div className="p-6 space-y-10 bg-white rounded-xl shadow-md">
  <form className="space-y-8" onSubmit={handleSubmit}>
    {/* Personal Info */}
    <div>
      <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-3/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-3/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Contact No</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Enter contact number"
            className="w-2/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>

    {/* Company Info */}
    <div>
      <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
        Company Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-3/4 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-1/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
            required
          />
        </div>
      </div>
    </div>

    {/* Security */}
    <div>
      <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
        Security
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">New Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-2/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[80%] font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            className="w-2/4 px-2 py-1 border rounded text-[80%] focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>

    {/* Save button */}
    <div className="flex justify-end">
      <button
        type="submit"
        className="bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition"
      >
        Update
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
