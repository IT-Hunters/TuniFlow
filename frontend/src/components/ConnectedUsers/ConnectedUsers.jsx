"use client"

import { useEffect, useState } from "react"
import io from "socket.io-client"
import "./ConnectedUsers.css"

const ConnectedUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5 // Adjust the number of users per page

  useEffect(() => {
    const socket = io("http://localhost:5000")

    socket.on("connect", () => {
      setIsLoading(false)
    })

    socket.on("userOnline", (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users)
        localStorage.setItem("onlineUsers", JSON.stringify(users))
        console.log("Online users:", users)
      } else {
        console.error("Expected an array of online users", users)
      }
    })

    socket.on("userOffline", (userId) => {
      setOnlineUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))
    })

    const storedUsers = localStorage.getItem("onlineUsers")
    if (storedUsers) {
      setOnlineUsers(JSON.parse(storedUsers))
    }

    return () => {
      socket.disconnect()
      localStorage.removeItem("onlineUsers")
    }
  }, [])

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = onlineUsers.slice(indexOfFirstUser, indexOfLastUser)

  const nextPage = () => {
    if (indexOfLastUser < onlineUsers.length) {
      setCurrentPage((prevPage) => prevPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1)
    }
  }

  // Helper functions
  const getUserInitials = (user) => user.name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || user._id.substring(0, 2).toUpperCase()

  const getDisplayName = (user) => user.fullname + ' ' +user.lastname || user.email || `User: ${user._id}`

  return (
    <div className="users-card">
      <div className="card-header">
        <div className="admin-card-header">
          <h2>Admin Dashboard</h2>
          <div className="user-count">
            <span className="count">{onlineUsers.length}</span>
            <span className="label">Online Users</span>
          </div>
        </div>

        <div className="card-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Connecting to server...</p>
            </div>
          ) : onlineUsers.length > 0 ? (
            <div>
              <h3>Active Users</h3>
              <div className="connected-user-list">
                <ul>
                  {currentUsers.map((user) => (
                    <li key={user._id} className="connected-user-item">
                      <div className="connected-user-avatar">
                        <span>{getUserInitials(user)}</span>
                      </div>
                      <div className="connected-user-info">
                        <div className="connected-user-details">
                          <p className="connected-user-name">{getDisplayName(user)}</p>
                          {user.email && <p className="connected-user-email">{user.email}</p>}
                          {user.role && <span className="connected-user-role">{user.role}</span>}
                        </div>
                        <span className="status-indicator"></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {Math.ceil(onlineUsers.length / usersPerPage)}</span>
                <button onClick={nextPage} disabled={indexOfLastUser >= onlineUsers.length}>Next</button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No users currently online</p>
            </div>
          )}
        </div>

        <div className="admin-card-footer">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
}

export default ConnectedUsers
