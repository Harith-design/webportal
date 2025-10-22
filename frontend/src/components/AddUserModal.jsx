// src/pages/AddUserModal.jsx
import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

function AddUserModal({ show, onClose, newUser, setNewUser, onSave }) {
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

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.firstName}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.email}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="BP Code"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.bpCode}
            onChange={(e) =>
              setNewUser({ ...newUser, bpCode: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Street Address"
            className="border p-2 rounded-md col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.street}
            onChange={(e) =>
              setNewUser({ ...newUser, street: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="City"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.city}
            onChange={(e) =>
              setNewUser({ ...newUser, city: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="County"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.county}
            onChange={(e) =>
              setNewUser({ ...newUser, county: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Postal Code"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.postalCode}
            onChange={(e) =>
              setNewUser({ ...newUser, postalCode: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Country"
            className="border p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={newUser.country}
            onChange={(e) =>
              setNewUser({ ...newUser, country: e.target.value })
            }
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3">
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
