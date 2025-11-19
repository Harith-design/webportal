// src/pages/AddUserModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import axios from "axios";
import { getBusinessPartners } from "../services/api";

function AddUserModal({ show, onClose, newUser, setNewUser, onSave }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [companyResults, setCompanyResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);
  
  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token");

  // --- Company search from SAP ---
  const handleCompanySearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
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

  // Close dropdown when clicking outside
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

  const isValidEmail = (val = "") =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
  
    const handleSave = async () => {
      const token = getToken();
      if (!token) {
        alert("Missing auth token. Please log in again.");
        return;
      }
  
      const fullName = `${newUser.firstName || ""} ${newUser.lastName || ""}`.trim();
  
      if (!fullName) {
        alert("Please fill in first name and last name.");
        return;
      }
      if (!newUser.email || !isValidEmail(newUser.email)) {
        alert("Please enter a valid email address.");
        return;
      }
      if (!newUser.password) {
        alert("Please provide a password.");
        return;
      }
  
      setSaving(true);
      try {
        await axios.post(
          "http://127.0.0.1:8000/api/users",
          {
            name: fullName,
            email: newUser.email,            // ✅ use user-entered email
            password: newUser.password,
            cardcode: newUser.cardCode || null,
            cardname: newUser.companyName || null,
            contact: newUser.phone || null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // Reset fields and inform parent to reload the list
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          companyName: "",
          cardCode: "",
        });
        onSave?.();
      } catch (e) {
        console.error("Create user failed:", e);
        const msg =
          e?.response?.data?.message ||
          (e?.response?.data?.errors &&
            Object.values(e.response.data.errors).flat()[0]) ||
          "Failed to create user";
        alert(msg);
      } finally {
        setSaving(false);
      }
    };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box*/}
      <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg z-10">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          disabled={saving}
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
              setNewUser({ ...newUser, firstName: e.target.value })}
            disabled={saving}  
          />

          {/* Last Name */}
          <input
            type="text"
            placeholder="Last Name"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })}
            disabled={saving}
          />

          {/* Email (NEW) */}
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.email || ""}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            disabled={saving}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.password || ""}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })}
            disabled={saving}
          />

          {/* Phone Number */}
          <input
            type="text"
            placeholder="Phone Number"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.phone}
            onChange={(e) =>
              setNewUser({ ...newUser, phone: e.target.value })}
            disabled={saving}
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
            <ul className="absolute z-20 w-full border rounded mt-1 max-h-40 overflow-y-auto shadow text-sm bg-white">
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
            disabled={saving}
          >
            Cancel
          </button>
          <button
           onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AddUserModal;
