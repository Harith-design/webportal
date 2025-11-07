// src/pages/UserList.jsx
import React, { useState, useEffect } from "react";
import { Search, UserPlus, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import AddUserModal from "./AddUserModal";
import { useNavigate } from "react-router-dom";

function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    phone: "",
    companyName: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: "John Doe",
        username: "john@example.com",
        company: "ABC Sdn Bhd",
        phone: "0172482406",
        status: "Active",
      },
      {
        id: 2,
        name: "Jane Smith",
        username: "jane@example.com",
        company: "DEF Enterprise",
        phone: "0172482406",
        status: "Active",
      },
      {
        id: 3,
        name: "Michael Lee",
        username: "michael@example.com",
        company: "GHI International",
        phone: "0172482406",
        status: "Inactive",
      },
    ]);
  }, []);

  // 🔹 Filter + Search Logic
  const filteredUsers = users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (
      search &&
      !(
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
        (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
        u.company.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  // 🔹 Pagination logic
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));

  // 🔹 Add user
  const handleAddUser = () => {
    const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();

    const newUserData = {
      id: users.length + 1,
      name: fullName,
      username: newUser.username,
      password: newUser.password,
      phone: newUser.phone,
      company: newUser.companyName,
      status: "Active",
    };

    setUsers([...users, newUserData]);
    setShowAddModal(false);
    setNewUser({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      phone: "",
      companyName: "",
    });
  };

  const renderStatus = (status) => {
    return status === "Active" ? (
      <span className="flex text-green-600">
        <CheckCircle size={16} className="mr-1" /> Active
      </span>
    ) : (
      <span className="flex text-red-600">
        <XCircle size={16} className="mr-1" /> Inactive
      </span>
    );
  };

   const handleMenuToggle = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  const handleEdit = (user) => {
    setOpenMenu(null);
    navigate(`/edituser/${user.id}`, { state: { user } });
  };

  const handleRemove = (user) => {
    setOpenMenu(null);
    navigate(`/users/remove/${user.id}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".user-menu")) return;
      setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden">
      {/* 🔹 Top Controls */}
      {/* 🔹 Top Controls */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
  {/* Left Section: Search + Status */}
  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
    {/* Search Bar */}
    <div className="relative w-full md:w-64">
      <Search
        size={16}
        className="text-gray-500 absolute left-2 top-1/2 -translate-y-1/2"
      />
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-8 py-1 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
      />
    </div>

    {/* Status Filter */}
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

  {/* Right Section: Add User Button */}
  <div className="flex justify-end">
    <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
    >
      <UserPlus size={16} /> Add User
    </button>
  </div>
</div>


      {/* 🔹 Users Table */}
      <div className="rounded-xl overflow-hidden shadow-sm flex-1 overflow-y-auto">
        <table className="table-fixed w-full border-collapse">
          <thead>
            <tr className="text-left text-[75%] font-bold border-b">
              <th className="w-1/5 px-4 py-2">NAME</th>
              <th className="w-1/5 px-4 py-2">USERNAME</th>
              <th className="w-1/5 px-4 py-2">PHONE</th>
              <th className="w-1/5 px-4 py-2">COMPANY</th>
              <th className="w-1/5 px-4 py-2">STATUS</th>
              <th className="w-[80px] px-4 py-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="even:bg-gray-50 text-left hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{user.phone}</td>
                  <td className="px-4 py-2">{user.company}</td>
                  <td className="px-4 py-2">{renderStatus(user.status)}</td>
                  <td className="px-4 py-2 text-center relative">
  <div className="flex justify-center">
    <button
      className="p-2 hover:bg-gray-200 rounded-full"
      onClick={() => handleMenuToggle(user.id)}
    >
      <MoreVertical size={18} />
    </button>
  </div>
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
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded text-xs ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded text-xs disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* 🔹 Add User Modal */}
      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        onSave={handleAddUser}
      />
    </div>
  );
}

export default UserList;
