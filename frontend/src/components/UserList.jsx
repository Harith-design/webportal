import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, CheckCircle, XCircle, MoreVertical } from "lucide-react";
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
        
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : [raw];

  
        // Server returns the mapped shape from UserController@index
        const mapped = list.map((u) => ({
          id: u.id,
          name: u.name || "N/A",
          email: u.email || "N/A",
          company: u.company || "N/A", // cardname
          company_code: u.company_code || "N/A", // cardcode
          contact_no: u.contact_no || "N/A",
          role: u.role || "N/A",
          status: u.status || "N/A",
        }));
  
        setUsers(mapped);
      } catch (e) {
        console.error("Failed to load users:", e);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      loadUsers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    const filteredUsers = users.filter(u => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (
      search &&
      !(
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
        (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
        u.company.toLowerCase().includes(search.toLowerCase())
      )
    ) return false;
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
      const maxRows = Math.floor((containerHeight - header.getBoundingClientRect().height) / row.getBoundingClientRect().height);
      setRowsPerPage(Math.max(1, maxRows));
    };
    updateRowsPerPage();
    window.addEventListener("resize", updateRowsPerPage);
    return () => window.removeEventListener("resize", updateRowsPerPage);
  }, [users]);

  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  const renderStatus = (status) => status === "Active" ? <span className="flex text-green-600"><CheckCircle size={16} className="mr-1"/> Active</span> : <span className="flex text-red-600"><XCircle size={16} className="mr-1"/> Inactive</span>;

  const handleMenuToggle = (id) => setOpenMenu(openMenu === id ? null : id);

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
    const handleClickOutside = (e) => { if (!e.target.closest(".user-menu")) setOpenMenu(null); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="px-6 pt-2 flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
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
          </select>
        </div>

        {/* Add User */}
        <div className="flex justify-end">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs hover:bg-blue-700 transition font-semibold">
            <UserPlus size={16}/> Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div ref={tableContainerRef} className="rounded-xl overflow-hidden border flex-1">
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
                key={user.id} className="even:bg-gray-50 hover:bg-gray-100 transition">
                <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.contact_no}</td>
                <td className="px-4 py-2">{user.company}</td>
                <td className="px-4 py-2">{renderStatus(user.status)}</td>
                <td className="px-4 py-2 text-center relative">
                  <button className="p-2 hover:bg-gray-200 rounded-full" onClick={() => handleMenuToggle(user.id)}>
                    <MoreVertical size={18}/>
                  </button>
                  {openMenu === user.id && (
                    <div className="user-menu absolute left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border rounded-md shadow-lg z-10">
                      <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleEdit(user)}>Edit</button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => handleRemove(user)}>Remove</button>
                    </div>
                  )}
                </td>
              </tr>
            ))
            ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                  {loading ? "Loading users..." : error || "No users found"}
                </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4 shrink-0">
        <button onClick={() => setCurrentPage(prev => Math.max(prev-1,1))} disabled={currentPage===1} className="px-3 py-1 border rounded text-xs disabled:opacity-50">Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`px-3 py-1 border rounded text-xs ${currentPage===i+1 ? "bg-blue-500 text-white" : ""}`}>{i+1}</button>
        ))}
        <button onClick={() => setCurrentPage(prev => Math.min(prev+1, totalPages))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded text-xs disabled:opacity-50">Next</button>
      </div>

      {/* Add User Modal */}
      <AddUserModal show={showAddModal} onClose={() => setShowAddModal(false)} newUser={newUser} setNewUser={setNewUser} onSave={() => {
          // Modal already created the user via API; refresh list here
          setShowAddModal(false);
          loadUsers();
        }}/>
    </div>
  );
}

export default UserList;
