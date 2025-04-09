"use client"

import { useEffect, useState, useMemo } from "react"
import { getAllUsers } from "../../../services/UserService"
import "./UsersTable.css"

const roleConfig = {
  ADMIN: { className: "role-badge admin", label: "Admin" },
  BusinessOwner: { className: "role-badge business-owner", label: "Business Owner" },
  Accountant: { className: "role-badge accountant", label: "Accountant" },
  FinancialManager: { className: "role-badge financial-manager", label: "Financial Manager" },
  BusinessManager: { className: "role-badge business-manager", label: "Business Manager" },
  RH: { className: "role-badge rh", label: "RH" },
}

const ITEMS_PER_PAGE = 10

const UsersTable = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({ fullname: "", lastname: "", email: "" })

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await getAllUsers()
        console.log("Fetched users:", response)
        setUsers(response)
        setError(null)
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("Failed to load users. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedRole("")
    setCurrentPage(1)
  }

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const filteredAndSortedUsers = useMemo(() => {
    const filteredUsers = users.filter((user) => {
      const matchesSearch = `${user.firstname} ${user.lastname} ${user.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchesRole = !selectedRole || user.userType === selectedRole

      return matchesSearch && matchesRole
    })

    if (sortConfig.key) {
      return [...filteredUsers].sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "name") {
          aValue = `${a.firstname} ${a.lastname}`.toLowerCase()
          bValue = `${b.firstname} ${b.lastname}`.toLowerCase()
        } else {
          aValue = a[sortConfig.key]?.toLowerCase() || ""
          bValue = b[sortConfig.key]?.toLowerCase() || ""
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filteredUsers
  }, [users, searchTerm, selectedRole, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedUsers, currentPage])

  const getPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      items.push(1)

      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      if (startPage > 2) items.push("ellipsis-start")

      for (let i = startPage; i <= endPage; i++) {
        items.push(i)
      }

      if (endPage < totalPages - 1) items.push("ellipsis-end")

      if (totalPages > 1) items.push(totalPages)
    }

    return items
  }

  const getSortDirectionIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "ascending" ? "↑" : "↓"
  }

  const renderRoleBadge = (role) => {
    const config = roleConfig[role] || { className: "role-badge default", label: role }
    return <span className={config.className}>{config.label}</span>
  }

  const handleEdit = (user) => {
    if (!user || !user._id) {
      alert("User ID is missing. Cannot edit this user.")
      return
    }
    setSelectedUser(user)
    setFormData({
      fullname: user.fullname,
      lastname: user.lastname,
      email: user.email,
    })
    setEditModalOpen(true)
  }

  const handleDelete = async (userId) => {
    if (!userId) {
      alert("User ID is missing. Cannot delete this user.")
      return
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`http://localhost:3000/users/deletbyid/${userId}`, {
          method: "DELETE",
        })
        const result = await response.json()
        if (response.ok) {
          setUsers(users.filter((user) => user._id !== userId))
          alert(result.message)
        } else {
          alert(result.message || "Failed to delete user")
        }
      } catch (err) {
        console.error("Error deleting user:", err)
        alert("An error occurred while deleting the user: " + (err.message || err))
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser || !selectedUser._id) {
      alert("User ID is missing. Cannot update this user.")
      return
    }
    try {
      const [firstname, ...lastnameArr] = formData.fullname.split(" ")
      const lastname = lastnameArr.join(" ")
      const response = await fetch(`http://localhost:3000/users/updatebyid/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: formData.fullname,
          lastname,
          email: formData.email,
        }),
      })
      const result = await response.json()
      if (response.ok) {
        setUsers(users.map((user) =>
          user._id === selectedUser._id ? { ...user, firstname, lastname, email: formData.email } : user
        ))
        setEditModalOpen(false)
        alert(result.message)
      } else {
        alert(result.message || "Failed to update user")
      }
    } catch (err) {
      console.error("Error updating user:", err)
      alert("An error occurred while updating the user: " + (err.message || err))
    }
  }

  if (isLoading) {
    return (
      <div className="users-card">
        <div className="card-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-search"></div>
        </div>
        <div className="card-content">
          <div className="skeleton-table">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="skeleton-row"></div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="users-card error">
        <div className="card-header">
          <h2 className="error-title">Error Loading Users</h2>
          <p>{error}</p>
        </div>
        <div className="card-content">
          <button onClick={() => window.location.reload()} className="btn btn-outline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="users-card min-users-card">
      <div className="card-header">
        <div className="header-top">
          <h2 className="title">User Management</h2>
          <div className="filter-and-search-container">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setCurrentPage(1)
              }}
              className="role-dropdown"
            >
              <option value="">All Roles</option>
              {Object.keys(roleConfig).map((role) => (
                <option key={role} value={role}>
                  {roleConfig[role].label}
                </option>
              ))}
            </select>
            <div className="search-container">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {(searchTerm || selectedRole) && (
          <button className="btn btn-text clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
      <div className="card-content">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="column-number">#</th>
                <th className="column-sortable" onClick={() => requestSort("name")}>
                  Full Name {getSortDirectionIcon("name")}
                </th>
                <th className="column-sortable" onClick={() => requestSort("email")}>
                  Email {getSortDirectionIcon("email")}
                </th>
                <th className="column-sortable" onClick={() => requestSort("userType")}>
                  Role {getSortDirectionIcon("userType")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => (
                  <tr key={user._id} className="table-row">
                    <td className="column-number">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="column-name">
                      {user.firstname} {user.lastname}
                    </td>
                    <td className="column-email">{user.email}</td>
                    <td className="column-role">{renderRoleBadge(user.userType)}</td>
                    <td className="column-actions">
                      <button
                        className="btn btn-action btn-edit"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-action btn-delete"
                        onClick={() => handleDelete(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={5} className="empty-message">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length > 0 && (
          <div className="table-footer">
            <div className="results-count">
              Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`pagination-prev ${currentPage === 1 ? "disabled" : ""}`}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <div className="pagination-numbers">
                  {getPaginationItems().map((item, i) => {
                    if (item === "ellipsis-start" || item === "ellipsis-end") {
                      return (
                        <span key={item} className="pagination-ellipsis">
                          ...
                        </span>
                      )
                    }

                    return (
                      <button
                        key={item}
                        className={`pagination-number ${currentPage === item ? "active" : ""}`}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>

                <button
                  className={`pagination-next ${currentPage === totalPages ? "disabled" : ""}`}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {editModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit User</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-action btn-save">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-action btn-cancel"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersTable