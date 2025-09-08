// src/pages/EditUser.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditUser() {
  const { id } = useParams(); // get user id from URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "User",
    status: "Active",
  });

  useEffect(() => {
    // Replace with API call: GET /users/:id
    const fetchUser = async () => {
      const user = {
        id,
        name: "John Doe",
        email: "john@example.com",
        company: "ABC Sdn Bhd",
        role: "Admin",
        status: "Active",
      };
      setFormData(user);
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   const toggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      status: !prev.status,
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated User:", formData);
    navigate("/users"); // redirect after save
  };

  return (
    <div className="p-6 space-y-10 bg-white rounded-xl shadow-md">
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Personal Information
          </h3>

          <div className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Company Information
          </h3>

          <div className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="flex-1 max-w-2xl px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

        {/* Account Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Status
          </h3>

          <div className="flex items-center space-x-4">
            <label className="w-40 text-sm font-medium">User Status</label>
            <button
              type="button"
              onClick={toggleStatus}
              className={`w-8 h-4 flex items-center rounded-full p-1 transition-colors ${
                formData.status ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  formData.status ? "translate-x-2" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                formData.status ? "text-green-600" : "text-gray-500"
              }`}
            >
              {formData.status ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUser;
