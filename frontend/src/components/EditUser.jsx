// src/pages/EditUser.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

function EditUser() {
  const { id } = useParams(); // get user id from URL
  const { state } = useLocation();
  const navigate = useNavigate();

  // initial state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "User",
    status: false, // false = Inactive, true = Active
  });

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const user = {
  //       id,
  //       name: "John Doe",
  //       email: "john@example.com",
  //       company: "ABC Sdn Bhd",
  //       role: "Admin",
  //       status: "Active",
  //     };
  //     setFormData(user);
  //   };

  //   fetchUser();
  // }, [id]);

  // when loading user data
  useEffect(() => {
    if (state?.user) {
      setFormData({
        ...state.user,
        status: state.user.status === "Active", // convert string to boolean
      });
    } else {
      console.warn("No user passed, fetching by ID:", id);
    }
  }, [id, state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   // toggle function
  const toggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      status: !prev.status,
    }));
  };


  const handleSubmit = (e) => {
  e.preventDefault();

  const payload = {
    ...formData,
    status: formData.status ? "Active" : "Inactive",
  };

  console.log("Updated User:", payload);
  navigate("/users");
};

  return (
    <div className="p-6 space-y-10 bg-white rounded-xl shadow-md">
      <form className="space-y-8" onSubmit={handleSubmit}>
  {/* Personal Info */}
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-700 border-b pb-2">
      Personal Information
    </h3>

    <div className="grid grid-cols-2 gap-6">
      {/* Name */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          required
        />
      </div>

      {/* Email */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          required
        />
      </div>
    </div>
  </div>

  {/* Company Info */}
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-700 border-b pb-2">
      Company Information
    </h3>

    <div className="grid grid-cols-2 gap-6">
      {/* Company */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">Company</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="Admin">Admin</option>
          <option value="User">User</option>
        </select>
      </div>
    </div>
  </div>

  {/* Status (keep full width) */}
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-700 border-b pb-2">
      Status
    </h3>

    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">User Status</label>
      <button
        type="button"
        onClick={toggleStatus}
        className={`w-8 h-4 flex items-center rounded-full p-1 transition-colors ${
          formData.status ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
            formData.status ? "translate-x-3" : "translate-x-0"
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
      className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-100"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
    >
      Update
    </button>
  </div>
</form>

    </div>
  );
}

export default EditUser;
