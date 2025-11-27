import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

function UserForm({
  fetchUsers,
  editingUser: editingUserProp,
  setEditingUser: setEditingUserProp,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // editing user can come from props or from navigate state
  const [editingUser, setEditingUser] = useState(
    editingUserProp || location.state?.user || null
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');

  // sync editingUser from props / state
  useEffect(() => {
    const user = editingUserProp || location.state?.user || null;
    setEditingUser(user);
  }, [editingUserProp, location.state]);

  // populate form when editingUser changes
  useEffect(() => {
    if (editingUser) {
      // try to read whatever shape your API uses
      const fullName = editingUser.name || '';
      let f = editingUser.firstName || editingUser.first_name || '';
      let l = editingUser.lastName  || editingUser.last_name  || '';

      // if API only returns a single "name", split it
      if (!f && !l && fullName) {
        const parts = fullName.split(' ');
        f = parts[0] || '';
        l = parts.slice(1).join(' ') || '';
      }

      setFirstName(f);
      setLastName(l);
      setEmail(editingUser.email || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
    }
  }, [editingUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // send names in the usual Laravel snake_case style
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email,
        };

        await updateUser(editingUser.id, payload);

        if (fetchUsers) {
          await fetchUsers();
        }

        if (setEditingUserProp) {
          setEditingUserProp(null);
        } else {
          navigate('/users'); // adjust route if your user list path is different
        }
      } else {
        // create mode
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email,
        };

        await createUser(payload);

        if (fetchUsers) {
          await fetchUsers();
        }

        setFirstName('');
        setLastName('');
        setEmail('');
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save user. Please check console/network.');
    }
  };

  return (
    <form
      className="flex flex-col md:flex-row gap-2 mb-4"
      onSubmit={handleSubmit}
    >
      <input
        className="border border-gray-300 rounded px-3 py-2 flex-1"
        placeholder="First Name"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        required
      />
      <input
        className="border border-gray-300 rounded px-3 py-2 flex-1"
        placeholder="Last Name"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
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
