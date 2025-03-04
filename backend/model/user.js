import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers } from '../../../services/UserService';

const roleFilters = ["ADMIN", "BUSINESS_OWNER", "ACCOUNTANT", "FINANCIAL_MANAGER", "BUSINESS_MANAGER", "RH"];

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); // Store selected role

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        setUsers(response);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Filter users dynamically
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (`${user.firstname} ${user.lastname} ${user.email}`)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (selectedRole ? user.userType === selectedRole : true) // Role filtering
    );
  }, [users, searchTerm, selectedRole]);

  return (
    <div className="recent-users">
      {/* Table Header with Search Bar */}
      <div className="table-header">
        <h2>Gestion des Utilisateurs</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Role Filter Buttons */}
      <div className="role-filters">
        <button 
          onClick={() => setSelectedRole('')} 
          className={`filter-button ${selectedRole === '' ? 'active' : ''}`}
        >
          All
        </button>
        {roleFilters.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`filter-button ${selectedRole === role ? 'active' : ''}`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <h4>Users List</h4>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.firstname} {user.lastname}</td>
                <td>{user.email}</td>
                <td>{user.userType}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
