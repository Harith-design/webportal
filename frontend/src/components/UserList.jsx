// src/pages/UserList.jsx
import React, { useEffect, useState } from "react";
import { Search, UserPlus, MoreVertical, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddUserModal from "./AddUserModal"; // 👈 add at top

function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bpCode: "",
    street: "",
    city: "",
    county: "",
    postalCode: "",
    country: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    setUsers([
      { id: 1, name: "John Doe", email: "john@example.com", company: "ABC Sdn Bhd", role: "Admin", status: "Active" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", company: "DEF Enterprise", role: "User", status: "Active" },
      { id: 3, name: "Michael Lee", email: "michael@example.com", company: "GHI International", role: "User", status: "Inactive" },
    ]);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleAddUser = () => {
    const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();
    const newUserData = {
      id: users.length + 1,
      name: fullName,
      email: newUser.email,
      company: newUser.bpCode,
      role: "User",
      status: "Active",
      address: `${newUser.street}, ${newUser.city}, ${newUser.county}, ${newUser.postalCode}, ${newUser.country}`,
    };
    setUsers([...users, newUserData]);
    setShowAddModal(false);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      bpCode: "",
      street: "",
      city: "",
      county: "",
      postalCode: "",
      country: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* User Table */}
      <div className="bg-white p-6 pb-20 rounded-xl shadow-md overflow-x-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="text-sm text-gray-500 border-b">
              <th className="px-4 py-2 font-normal text-left">Name</th>
              <th className="px-4 py-2 font-normal text-left">Email</th>
              <th className="px-4 py-2 font-normal text-left">Company</th>
              <th className="px-4 py-2 font-normal text-left">Role</th>
              <th className="px-4 py-2 font-normal text-left">Status</th>
              <th className="px-4 py-2 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="even:bg-gray-50 hover:bg-gray-100 relative">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.company}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full font-medium
                      ${user.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right relative">
                  <button
                    className="p-2 hover:bg-gray-200 rounded-full"
                    onClick={() => handleMenuToggle(user.id)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenu === user.id && (
                    <div className="user-menu absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-10">
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
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-6 italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
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
