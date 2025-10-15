import React, { useState } from "react";
import { Pencil } from "lucide-react";
import UserAvatar from "../components/UserAvatar";

function EditProfile() {
  const [formData, setFormData] = useState({
    name: "sitin",
    email: "sitin@gmail.com",
    role: "User",
    company: "ABC Sdn Bhd",
    contact: "",
    password: "",
    confirmPassword: "",
    companyLogo: null,      // New field
    logoPreview: null,      // For preview
  });

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        companyLogo: file,
        logoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("✅ Profile updated successfully (demo only).");
    console.log("Profile data:", formData, "Picture:", profilePic);
  };

  return (
    <div className="p-6 space-y-10 bg-white rounded-xl shadow-md">
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left side - inputs */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Right side - profile picture */}
            <div className="relative flex flex-col items-center">
              <div className="relative">
    {preview ? (
      <img
        src={preview}
        alt="Profile"
        className="w-36 h-36 rounded-full object-cover border shadow-md"
      />
    ) : (
      <UserAvatar name={formData.name} size={144} />
    )}

    <input
      type="file"
      accept="image/*"
      id="profilePicInput"
      onChange={handlePicChange}
      className="hidden"
    />

    <label
      htmlFor="profilePicInput"
      className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg cursor-pointer transition hover:bg-white border"
    >
      <Pencil size={14} />
      <span className="text-xs">Edit</span>
    </label>
  </div>
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

            {/* Company Logo Upload */}
            <div className="flex flex-col mt-2">
              <label className="text-[80%] font-medium mb-1">Company Logo</label>
              <div className="relative w-32 h-16 border rounded bg-gray-50 flex items-center justify-center shadow-sm">
                <img
                  src={formData.logoPreview || "https://via.placeholder.com/120x60?text=Logo"}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
                <input
                  type="file"
                  accept="image/*"
                  id="companyLogoInput"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="companyLogoInput"
                  className="absolute bottom-1 right-1 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded cursor-pointer border hover:bg-white"
                >
                  <Pencil size={12} />
                  <span className="text-xs">Edit</span>
                </label>
              </div>
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
            Save
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
