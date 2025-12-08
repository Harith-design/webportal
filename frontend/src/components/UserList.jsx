import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Smile, Frown, MoreVertical } from "lucide-react";
import AddUserModal from "./AddUserModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableContainerRef = useRef(null);
  const navigate = useNavigate();

  // These are the fields used by AddUserModal
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "", // used as email when saving
    password: "",
    phone: "",
    companyName: "", // CardName (from SAP)
    cardCode: "", // CardCode (from SAP)
  });

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await axios.get("http://127.0.0.1:8000/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("Raw API response:", res.data);

      // support both { data: [...] } and plain [...]
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw : [];

      const mapped = list.map((u) => {
        // resolve company from multiple possible keys
        const company =
          u.company ??
          u.company_name ??
          u.companyName ??
          u.cardname ??
          u.CardName ??
          "N/A";

        // resolve raw role from different API shapes, normalize to lowercase
        const rawRole =
          u.role ?? u.Role ?? u.user_role ?? u.userRole ?? "user";
        const role = String(rawRole).toLowerCase();

        // 🔹 derive Active/Inactive from various boolean/flag fields
        const isActiveValue =
          u.is_active ??
          u.active ??
          u.Active ??
          u.IsActive ??
          u.Is_Active ??
          null;

        let derivedStatus = "";
        if (isActiveValue !== null && isActiveValue !== undefined) {
          const v = String(isActiveValue).toLowerCase();
          if (v === "1" || v === "true" || v === "active" || v === "yes") {
            derivedStatus = "Active";
          } else if (
            v === "0" ||
            v === "false" ||
            v === "inactive" ||
            v === "no"
          ) {
            derivedStatus = "Inactive";
          }
        }

        // resolve status from multiple possible keys (e.g. Active/Inactive)
        const rawStatus =
          u.status ??
          u.Status ??
          u.user_status ??
          u.userStatus ??
          u.status_name ??
          u.StatusName ??
          derivedStatus ??
          "";

        // keep existing behaviour: role in Status column + Active/Inactive if present
        const statusParts = [];
        // include role label (Admin | User)
        statusParts.push(role === "admin" ? "Admin" : "User");

        // include Active/Inactive if present in API / derived
        const s = String(rawStatus).trim();
        if (s) {
          const lower = s.toLowerCase();
          if (lower.includes("active")) statusParts.push("Active");
          else if (lower.includes("inactive")) statusParts.push("Inactive");
          else statusParts.push(s); // any other raw status
        }

        const status = statusParts.join(" • ");

        return {
          id: u.id,
          name:
            u.name ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            "N/A",
          email: u.email || u.username || "N/A",
          company,
          company_code: u.company_code ?? u.cardCode ?? u.CardCode ?? "N/A",
          contact_no: u.contact_no ?? u.phone ?? "N/A",
          role: role === "admin" ? "admin" : "user",
          status, // e.g. "Admin • Active"
        };
      });

      setUsers(mapped);
    } catch (e) {
      console.error("Failed to load users:", e);
      // only show error text inside the page now; no redirects
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Quick client-side guard using stored role (no API, no waiting)
  useEffect(() => {
    const storedRole =
      localStorage.getItem("user_role") ||
      sessionStorage.getItem("user_role");

    if (!storedRole) {
      // not logged in or missing role -> go login
      navigate("/login");
      return;
    }

    if (storedRole.toLowerCase() !== "admin") {
      alert("You are not allowed to access this page.");
      navigate(-1); // back to previous page
      return;
    }

    // Admin -> load data
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const filteredUsers = users.filter((u) => {
    if (statusFilter !== "all") {
      const sf = String(statusFilter).toLowerCase();
      const us = String(u.status || u.role || "").toLowerCase();
      // allow matching if the selected filter appears in the status string
      if (!us.includes(sf)) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const phone = (u.contact_no || u.phone || "").toLowerCase();
      const company = (u.company || "").toLowerCase();

      if (
        !(
          name.includes(q) ||
          email.includes(q) ||
          username.includes(q) ||
          phone.includes(q) ||
          company.includes(q)
        )
      ) {
        return false;
      }
    }

    return true;
  });

  // reset to page 1 if search changes (optional but nice UX)
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 🔹 Dynamic rows calculation
  useEffect(() => {
    const updateRowsPerPage = () => {
      if (!tableContainerRef.current) return;
      const containerHeight = tableContainerRef.current.clientHeight;
      const header = tableContainerRef.current.querySelector("thead");
      const row = tableContainerRef.current.querySelector("tbody tr");
      if (!header || !row) return;
      const maxRows = Math.floor(
        (containerHeight - header.getBoundingClientRect().height) /
          row.getBoundingClientRect().height
      );
      setRowsPerPage(Math.max(1, maxRows));
    };
    updateRowsPerPage();
    window.addEventListener("resize", updateRowsPerPage);
    return () => window.removeEventListener("resize", updateRowsPerPage);
  }, [users]);

  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage)
  );

  const renderStatus = (statusText) => {
    // statusText might be "Admin • Active" or "User" etc.
    if (!statusText) return "N/A";
    const parts = String(statusText).split("•").map((p) => p.trim());

    // first part is role (Admin / User)
    const rolePart = parts[0] || "";
    const secondPart = parts[1] || null; // Active/Inactive or extra

    const roleBadge =
      rolePart.toLowerCase() === "admin" ? (
        <span className="inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-semibold bg-gradient-to-br from-purple-100 to-purple-200 text-purple-800 mr-2">
          Admin
        </span>
      ) : (
        <span className="inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-semibold bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 mr-2">
          User
        </span>
      );

    let statusBadge = null;
    if (secondPart) {
      const s = secondPart.toLowerCase();
      if (s.includes("active")) {
        statusBadge = (
          <span
            className="inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-medium text-[#007edf]"
            style={{
              background:
                "radial-gradient(circle at 20% 80%, #f9b8ffff, #bc92ffff)",
            }}
          >
            <Smile size={14} className="mr-1" />
            Active
          </span>
        );
      } else if (s.includes("inactive")) {
        statusBadge = (
          <span
            className="inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-medium text-[#16aa3dff]"
            style={{
              background:
                "radial-gradient(circle at 20% 80%, #ffbcbcff, #ff50a4ff)",
            }}
          >
            <Frown size={14} className="mr-1" />
            Inactive
          </span>
        );
      } else {
        statusBadge = (
          <span className="inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-medium">
            {secondPart}
          </span>
        );
      }
    }

    return (
      <div className="flex items-center">
        {roleBadge}
        {statusBadge}
      </div>
    );
  };

  const handleMenuToggle = (id) =>
    setOpenMenu(openMenu === id ? null : id);

  const handleEdit = (user) => {
    setOpenMenu(null);
    navigate(`/edituser/${user.id}`, {
      state: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company, // maps to cardname on edit screen
          role: user.role,
          status: user.status,
          contact_no: user.contact_no,
          company_code: user.company_code,
        },
      },
    });
  };

  const handleRemove = async (user) => {
    setOpenMenu(null);
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`))
      return;

    const token = getToken();
    if (!token) {
      alert("Missing auth token. Please log in again.");
      return;
    }

    const prev = users;
    setUsers((curr) => curr.filter((u) => u.id !== user.id));

    try {
      await axios.delete(`http://127.0.0.1:8000/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete user.");
      setUsers(prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-menu")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Top Controls */}
      <div className="flex flex-row items-end justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search
              size={16}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>

        {/* Add User */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs hover:bg-blue-700 transition font-semibold"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div
        ref={tableContainerRef}
        className="rounded-xl overflow-hidden border  border-gray-300 flex-1"
      >
        <table className="table-auto w-full">
          <thead>
            <tr className="text-left text-xs border-b font-medium">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="even:bg-gray-50 hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">
                    {user.name}
                  </td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.contact_no}</td>
                  <td className="px-4 py-2">{user.company}</td>
                  <td className="px-4 py-2">{renderStatus(user.status)}</td>
                  <td className="px-4 py-2 text-center relative">
                    <button
                      className="hover:bg-gray-200 rounded-full"
                      onClick={() => handleMenuToggle(user.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === user.id && (
                      <div className="user-menu absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border rounded-md shadow-lg z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(user)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-gray-500"
                >
                  {loading ? "Loading users..." : error || "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4 shrink-0">
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.max(prev - 1, 1))
          }
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded text-xs ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, totalPages)
            )
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        onSave={() => {
          // Modal already created the user via API; refresh list here
          setShowAddModal(false);
          loadUsers();
        }}
      />
    </div>
  );
}

export default UserList;
