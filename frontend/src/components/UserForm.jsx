import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../services/api';

function UserForm({ fetchUsers, editingUser, setEditingUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
    } else {
      setName('');
      setEmail('');
    }
  }, [editingUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, { name, email }).then(() => {
        fetchUsers();
        setEditingUser(null);
      });
    } else {
      createUser({ name, email }).then(() => {
        fetchUsers();
        setName('');
        setEmail('');
      });
    }
  };

  return (
    <form className="flex flex-col md:flex-row gap-2 mb-4" onSubmit={handleSubmit}>
      <input
        className="border border-gray-300 rounded px-3 py-2 flex-1"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border border-gray-300 rounded px-3 py-2 flex-1"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        type="submit"
      >
        {editingUser ? 'Update' : 'Add'} User
      </button>
    </form>
  );
}

export default UserForm;
