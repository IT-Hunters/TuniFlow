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
  const [selectedRoles, setSelectedRoles] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

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
  const handleRoleChange = (role) => {
    setSelectedRoles((prevState) => ({
      ...prevState,
      [role]: !prevState[role],
    }))
    setCurrentPage(1) 
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedRoles({})
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

      // If no roles are selected, show all users
      const activeRoleFilters = Object.entries(selectedRoles).filter(([_, isSelected]) => isSelected)
      const matchesRole = activeRoleFilters.length === 0 || selectedRoles[user.userType]

      return matchesSearch && matchesRole
    })

    // Then sort the filtered users
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
  }, [users, searchTerm, selectedRoles, sortConfig])

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

  // Error state
  if (error) {
    return (
      <div className="users-card error">
        <div className="card-header">
          <h2 className="error-title">Error Loading Users</h2>
          <p>{error}</p>
        </div>
        <div className="card-content">
          <button onClick={() => window.location.reload()} className="btn btn-outline">
            <span className="icon">↻</span>
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
          <h2 className="title">Gestion des Utilisateurs</h2>
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
        <div className="filter-section">
          <span className="filter-label">Filter by role:</span>
          <div className="role-filters">
            {Object.keys(roleConfig).map((role) => (
              <div key={role} className="filter-checkbox">
                <input
                  type="checkbox"
                  id={`role-${role}`}
                  checked={selectedRoles[role] || false}
                  onChange={() => handleRoleChange(role)}
                />
                <label htmlFor={`role-${role}`}>{roleConfig[role].label}</label>
              </div>
            ))}
          </div>
          {(searchTerm || Object.values(selectedRoles).some(Boolean)) && (
            <button className="btn btn-text clear-filters" onClick={clearFilters}>
              <span className="icon">✕</span>
              Clear filters
            </button>
          )}
        </div>
      </div>
      <div className="card-content">
        <div className="table-container min-users-table">
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
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="table-row">
                    <td className="column-number">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="column-name">
                      {user.firstname} {user.lastname}
                    </td>
                    <td className="column-email">{user.email}</td>
                    <td className="column-role">{renderRoleBadge(user.userType)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={4} className="empty-message">
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
      </div>
    </div>
  )
}

export default UsersTable

