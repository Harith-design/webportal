import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { getBusinessPartners, updateUser, getCurrentUser } from "../services/api";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import axios from "axios";

const BACKEND = "http://127.0.0.1:8000";
// Build a safe absolute URL for images
const toAbsoluteUrl = (path) => {
  if (!path) return "";
  const s = String(path).trim();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("blob:") ||
    s.startsWith("data:")
  ) {
    return s;
  }
  if (s.startsWith("/")) return `${BACKEND}${s}`;
  return `${BACKEND}/${s.replace(/^\/+/, "")}`;
};

// Local fallback avatar (SVG data URI)
const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#f3f4f6"/></linearGradient></defs>
      <rect width="144" height="144" rx="72" fill="url(#g)"/>
      <circle cx="72" cy="54" r="26" fill="#d1d5db"/>
      <path d="M20 128a52 52 0 0 1 104 0" fill="#d1d5db"/>
    </svg>`
  );

// === Image helpers ===
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const REJECTED_TYPES = ["image/heic", "image/heif", "image/avif"]; // browsers may not decode these reliably
const MAX_SIDE = 2000; // px
const MAX_BYTES_BEFORE_COMPRESS = 7 * 1024 * 1024; // 7MB

async function downscaleAndCompress(file) {
  // If type is not directly accepted, bail out early
  if (REJECTED_TYPES.includes(file.type)) {
    throw new Error(
      "This image format isn't supported by the browser/backend. Please use JPG/PNG/WebP."
    );
  }

  // If it's already small and an accepted type, return as-is
  if (ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_BYTES_BEFORE_COMPRESS) {
    return file;
  }

  // Try to decode the image
  const blobURL = URL.createObjectURL(file);
  let bitmap;
  try {
    bitmap = await createImageBitmap(await (await fetch(blobURL)).blob());
  } catch (e) {
    URL.revokeObjectURL(blobURL);
    throw new Error("Could not read this image. Try a different file (JPG/PNG/WebP).");
  }
  URL.revokeObjectURL(blobURL);

  // Compute target size
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  // Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { alpha: true });

  // If original is PNG with transparency and we later export JPEG, set white bg
  if (file.type === "image/png") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // Choose output format: prefer JPEG, fallback to WebP if browser prefers it
  const preferWebP = file.type === "image/webp";
  const outType = preferWebP ? "image/webp" : "image/jpeg";
  const quality = 0.9;

  const outBlob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), outType, quality)
  );

  if (!outBlob) throw new Error("Failed to process the image.");

  // Name the file sensibly
  const ext = outType === "image/webp" ? "webp" : "jpg";
  const outFile = new File([outBlob], `profile.${ext}`, { type: outType, lastModified: Date.now() });
  return outFile;
}

function EditUser() {
  const { id } = useParams(); // user id from /edituser/:id
  const { state } = useLocation(); // optional user passed from list
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);

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
    status: false,
    profile_picture: ""
  });

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token");

  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [companyResults, setCompanyResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [picError, setPicError] = useState("");

  // Load user: prefer state.user, otherwise fetch by id
  useEffect(() => {
    const hydrate = async () => {
      try {
        if (state?.user) {
          const u = state.user;
        setFormData({
          id: u.id,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          name: u.name || "",
          email: u.email || "",
          contact: u.contact_no || "",
          company: u.company || "",
          CardCode: u.CardCode || "",
          CardName: u.CardName || "",
          street: u.street || "",
          city: u.city || "",
          county: u.county || "",
          postalCode: u.postalCode || "",
          country: u.country || "",
          password: "",
          confirmPassword: "",
          profile_picture: u.profile_picture || "",
          status: (u.status || "").toLowerCase() === "active",
        });
      // ✅ NEW: show existing profile picture in the avatar
          if (u.profile_picture) setPreview(toAbsoluteUrl(u.profile_picture));
          else setPreview(null);
        }
        else {
        const token = getToken();
        const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const u = res.data || {};
        setFormData({
          id: u.id,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          name: u.name || "",
          email: u.email || "",
          contact: u.contact_no || "",
          company: u.company || "",
          CardCode: u.CardCode || "",
          CardName: u.CardName || "",
          street: u.street || "",
          city: u.city || "",
          county: u.county || "",
          postalCode: u.postalCode || "",
          country: u.country || "",
          password: "",
          confirmPassword: "",
          profile_picture: u.profile_picture || "",
          status: false,
        });
        // ✅ NEW: preview for fetched user
        if (u.profile_picture) setPreview(toAbsoluteUrl(u.profile_picture));
        else setPreview(null);
      }
      } catch (e) {
        console.error("Failed to load user:", e);
        alert("Failed to load user details.");
      } finally {
        setInitializing(false);
      }
    };
    hydrate();
  }, [id, state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePicChange = async (e) => {
    setPicError("");
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate basic MIME first
      if (!ACCEPTED_TYPES.includes(file.type)) {
        if (REJECTED_TYPES.includes(file.type)) {
          throw new Error("HEIC/HEIF/AVIF is not supported. Please choose JPG/PNG/WebP.");
        }
        // Some devices report empty type; still try to process
      }

      const processed = await downscaleAndCompress(file);

      // Show preview (blob URL)
      const objectUrl = URL.createObjectURL(processed);
      setPreview(objectUrl);

      setFormData((p) => ({ ...p, _file: processed }));
    } catch (err) {
      console.error(err);
      setPicError(err.message || "Invalid or unsupported image file.");
      // revert input if failed
      e.target.value = "";
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

  const toggleStatus = () => {
    setFormData((prev) => ({ ...prev, status: !prev.status }));
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
    const token = getToken();
    setPicError("");
    if (!token) {
      alert("Missing auth token. Please log in again.");
      return;
    }

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
      CardCode: formData.CardCode || "",
      CardName: formData.CardName || "",
      street: formData.street || "",
      city: formData.city || "",
      county: formData.county || "",
      postalCode: formData.postalCode || "",
      country: formData.country || "",
    };

    if (formData.password) payload.password = formData.password;
    if (formData._file) payload.profile_picture = formData._file;

    await updateUser(formData.id, payload);

    toast.success("Profile updated successfully!");
    navigate("/users"); // optional, redirect after success
  } catch (error) {
    console.error("Error updating profile:", error.response || error);
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.email?.[0] ||
      "Failed to update user. Please try again";
    toast.error("msg");
  }
  finally {
      setLoading(false);
    }
};

if (initializing) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading user…</div>
      </div>
    );
  }

  // Decide which src to render
  const imgSrc =
    preview ||
    (formData.profile_picture
      ? `${toAbsoluteUrl(formData.profile_picture)}?t=${Date.now()}`
      : FALLBACK);

  return (
    <div className="p-6 space-y-10">
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

            {/* Avatar */}
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <img
                  src={imgSrc}
                  alt="Profile"
                  onError={(e) => (e.currentTarget.src = FALLBACK)}
                  className="w-36 h-36 rounded-full object-cover border shadow-md bg-gray-100"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp" // narrow to reliable types
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
              {picError && (
                <p className="mt-2 text-xs text-red-600 max-w-[18rem] text-center">
                  {picError}
                </p>
              )}
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
                <p className="text-sm text-gray-500 mt-1">Searching...</p>
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
            className="bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Save
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
    </div>
  );
}

export default EditUser;
