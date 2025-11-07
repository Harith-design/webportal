import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { getBusinessPartners, updateUser, getCurrentUser } from "../services/api";
import toast from "react-hot-toast";
import UserAvatar from "../components/UserAvatar";

function EditProfile() {
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    contact: "",
    company: "",
    password: "",
    confirmPassword: "",
    CardCode: "",
    CardName: "",
    street: "",
    city: "",
    county: "",
    postalCode: "",
    country: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyResults, setCompanyResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Load current user info
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await getCurrentUser();
        const user = res.data;
        setFormData({
          id: user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name: user.name || "",
          email: user.email || "",
          contact: user.contact_no || "",
          company: user.company || "",
          CardCode: user.cardcode || "",
          CardName: user.cardname || "",
          street: user.street || "",
          city: user.city || "",
          county: user.county || "",
          postalCode: user.postalCode || "",
          country: user.country || "",
          password: "",
          confirmPassword: "",
        });
        // ✅ Load existing profile picture if available
      if (user.profile_picture) {
        setPreview(`http://127.0.0.1:8000/${user.profile_picture}`);
      }

      } catch (err) {
        console.error("Error loading user:", err);
      }
    }
    fetchUser();
  }, []);

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

  // SAP Company Search
  const handleCompanySearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setLoadingSearch(true);
    try {
      const res = await getBusinessPartners(value);
      setCompanyResults(res.data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setCompanyResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectCompany = (company) => {
    setFormData((prev) => ({
      ...prev,
      CardCode: company.CardCode,
      CardName: company.CardName,
      company: company.CardName,
    }));
    setCompanyResults([]);
    setSearchTerm(company.CardName);
  };

  // Save profile
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password && formData.password !== formData.confirmPassword) {
    toast.error("❌ Passwords do not match!");
    return;
  }

  try {
    const payload = {
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      name: formData.name || "",
      email: formData.email || "",
      contact_no: formData.contact || "",
      cardcode: formData.CardCode || "",
      cardname: formData.CardName || "",
      street: formData.street || "",
      city: formData.city || "",
      county: formData.county || "",
      postalCode: formData.postalCode || "",
      country: formData.country || "",
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    await updateUser(formData.id, payload);

    toast.success("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error.response || error);
    toast.error("Failed to update profile. Please try again.");
  }
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
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-[80%] font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-3/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[80%] font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-3/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[80%] font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-3/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
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
                  className="w-2/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Profile Picture */}
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
              <label className="text-[80%] font-medium mb-1">
                Search Company (from SAP)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleCompanySearch}
                placeholder="Enter company name"
                className="w-3/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
              {loadingSearch && (
                <p className="text-xs text-gray-500 mt-1">Searching...</p>
              )}
              {companyResults.length > 0 && (
                <ul className="border rounded mt-1 max-h-40 overflow-y-auto bg-white shadow text-sm w-3/4">
                  {companyResults.map((c) => (
                    <li
                      key={c.CardCode}
                      onClick={() => handleSelectCompany(c)}
                      className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                    >
                      {c.CardCode} - {c.CardName}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">
                Selected Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.CardName || formData.company}
                readOnly
                className="w-3/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Company Address */}
        <div>
          <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">
            Company Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-3/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-2/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">County</label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="w-2/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-1/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-1/4 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
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
                className="w-2/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[80%] font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-2/4 px-2 py-1 border rounded text-[80%] focus:ring-1 focus:ring-blue-400 focus:outline-none"
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

      {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
    </div>
  );
}

export default EditProfile;
