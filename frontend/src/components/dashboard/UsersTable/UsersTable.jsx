"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { getAllUsers } from "../../../services/UserService"
import EditUserModal from "./EditUserModal"
import "./UsersTable.css"
import { Search, X, Edit, Trash2, RefreshCw } from "lucide-react"

const roleConfig = {
  ADMIN: { className: "role-badge role-badge-admin", label: "Admin" },
  BusinessOwner: { className: "role-badge role-badge-business-owner", label: "Business Owner" },
  Accountant: { className: "role-badge role-badge-accountant", label: "Accountant" },
  FinancialManager: { className: "role-badge role-badge-financial-manager", label: "Financial Manager" },
  BusinessManager: { className: "role-badge role-badge-business-manager", label: "Business Manager" },
  RH: { className: "role-badge role-badge-rh", label: "RH" },
}

const ITEMS_PER_PAGE = 10

export default function UsersTable() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const token = localStorage.getItem("token")

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await getAllUsers()
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

  useEffect(() => {
    if (deleteModalOpen) {
      document.getElementById("cancel-delete-button")?.focus()
    }
  }, [deleteModalOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && deleteModalOpen) {
        closeDeleteModal()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [deleteModalOpen])

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
    const config = roleConfig[role] || { className: "role-badge role-badge-default", label: role }
    return <span className={config.className}>{config.label}</span>
  }

  const handleEdit = useCallback((user) => {
    if (!user || !user._id) {
      alert("User ID is missing. Cannot edit this user.")
      return
    }
    setSelectedUser(user)
    setEditModalOpen(true)
  }, [])

  const handleSaveUser = useCallback(
    (updatedUser) => {
      setUsers((prev) =>
        prev.map((user) => (user._id === updatedUser._id ? updatedUser : user)),
      )
      setEditModalOpen(false)
      setSelectedUser(null)
    },
    [],
  )

  const handleCloseModal = useCallback(() => {
    setEditModalOpen(false)
    setSelectedUser(null)
  }, [])

  const handleDelete = useCallback((user) => {
    if (!user || !user._id) {
      alert("User ID is missing. Cannot delete this user.")
      return
    }
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(
    async (userId) => {
      try {
        const response = await fetch(`http://localhost:3000/users/deletbyid/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      } finally {
        setDeleteModalOpen(false)
        setUserToDelete(null)
      }
    },
    [users, token],
  )

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false)
    setUserToDelete(null)
  }, [])

  if (isLoading) {
    return (
      <div className="users-card">
        <div className="card-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-search"></div>
        </div>
        <div className="card-content">
          <div className="skeleton-table">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="skeleton skeleton-row"></div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="users-card users-card-error">
        <div className="card-header">
          <h2 className="error-title">Error Loading Users</h2>
          <p>{error}</p>
        </div>
        <div className="card-content">
          <button onClick={() => window.location.reload()} className="btn btn-outline">
            <RefreshCw size={16} className="mr-2" /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="users-card">
      <div className="card-header">
        <div className="header-container">
          <div className="header-top">
            <h2 className="title">User Management</h2>
            <div className="filter-search-container">
              <div className="select-container">
                <select
                  className="select"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="">All Roles</option>
                  {Object.keys(roleConfig).map((role) => (
                    <option key={role} value={role}>
                      {roleConfig[role].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-container">
                <Search className="search-icon" size={16} />
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
                  <button className="clear-button" onClick={() => setSearchTerm("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
          {(searchTerm || selectedRole) && (
            <button className="btn btn-ghost btn-sm clear-filters" onClick={clearFilters}>
              <X size={16} style={{ marginRight: "4px" }} /> Clear filters
            </button>
          )}
        </div>
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
                <th className="column-actions">Actions</th>
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
                    <td>{user.email}</td>
                    <td>{renderRoleBadge(user.userType)}</td>
                    <td className="column-actions">
                      <div className="actions-container">
                        <button
                          className="btn btn-outline btn-sm btn-edit btn-icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={16} />
                          <span className="btn-text-mobile-hidden">Edit</span>
                        </button>
                        <button
                          className="btn btn-outline btn-sm btn-delete btn-icon"
                          onClick={() => handleDelete(user)}
                          aria-label={`Delete ${user.firstname} ${user.lastname}`}
                        >
                          <Trash2 size={16} />
                          <span className="btn-text-mobile-hidden">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-message">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedUsers.length > 0 && (
        <div className="card-footer">
          <div className="results-count">
            Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-content">
                <button
                  className={`pagination-item ${currentPage === 1 ? "pagination-disabled" : ""}`}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
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
                      className={`pagination-item ${currentPage === item ? "pagination-item-active" : ""}`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  )
                })}
                <button
                  className={`pagination-item ${currentPage === totalPages ? "pagination-disabled" : ""}`}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <EditUserModal
        isOpen={editModalOpen}
        user={selectedUser}
        token={token}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
      />

      {deleteModalOpen && (
        <div className="delete-confirmation-modal modal-overlay" role="dialog" aria-labelledby="delete-modal-title">
          <div className="modal-content">
            <h2 id="delete-modal-title" className="modal-title">
              Confirm Deletion
            </h2>
            <p className="modal-message">
              Are you sure you want to delete <strong>{userToDelete?.firstname} {userToDelete?.lastname}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                id="cancel-delete-button"
                type="button"
                className="btn btn-outline"
                onClick={closeDeleteModal}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-delete"
                onClick={() => confirmDelete(userToDelete._id)}
                aria-label="Delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}