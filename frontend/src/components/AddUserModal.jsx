// src/pages/AddUserModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getBusinessPartners } from "../services/api";

function AddUserModal({ show, onClose, newUser, setNewUser, onSave }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [companyResults, setCompanyResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef(null);



  // 🔍 Fetch company list from SAP (like EditProfile)
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
    setNewUser({
      ...newUser,
      companyName: company.CardName,
      cardCode: company.CardCode,
    });
    setSearchTerm(company.CardName);
    setCompanyResults([]);
  };

  // 🧩 Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setCompanyResults([]); // close dropdown
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg z-10">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Add New User</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* First Name */}
          <input
            type="text"
            placeholder="First Name"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.firstName}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />

          {/* Last Name */}
          <input
            type="text"
            placeholder="Last Name"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
          />

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.password || ""}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />

          {/* Phone Number */}
          <input
            type="text"
            placeholder="Phone Number"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.phone}
            onChange={(e) =>
              setNewUser({ ...newUser, phone: e.target.value })
            }
          />

          {/* Company Search */}
         <div className="col-span-2 relative" ref={searchRef}>
  <input
    type="text"
    placeholder="Search Company (from SAP)"
    className="border p-2 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
    value={searchTerm}
    onChange={handleCompanySearch}
  />
  {companyResults.length > 0 && (
    <ul className="absolute z-20 w-full border rounded mt-1 max-h-40 overflow-y-auto bg-white shadow text-sm">
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


        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3 text-sm">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddUserModal;
