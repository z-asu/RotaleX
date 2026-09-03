import React, { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser, getCurrentUser, setCurrentUser } from '../api'
import { confirmDelete, showError } from '../swal'

export default function Users({ onRoleChanged }) {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(false)
  const me = getCurrentUser()

  async function load() {
    try {
      setUsers(await getUsers())
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <p className="loading">Failed to load data.</p>
  if (!users) return <p className="loading">Loading...</p>

  async function handleRole(user, role) {
    try {
      const updated = await updateUserRole(user.id, role)
      if (updated.id === me.id) {
        setCurrentUser(updated)
        onRoleChanged(updated)
      }
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDelete(user) {
    const confirmed = await confirmDelete('Delete User', `"${user.username}" will be permanently deleted.`)
    if (!confirmed) return
    try {
      await deleteUser(user.id)
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Users</h1>
      </div>

      <div className="card user-table">
        <div className="user-row user-head">
          <span>Username</span>
          <span>Email</span>
          <span>Role</span>
          <span>Actions</span>
        </div>
        {users.map((u) => (
          <div key={u.id} className="user-row">
            <span className="user-name">
              {u.username}
              {u.id === me.id && <em className="you-badge"> (you)</em>}
            </span>
            <span className="user-email">{u.email}</span>
            <span>
              <select
                className="role-select"
                value={u.role}
                onChange={(e) => handleRole(u, e.target.value)}
              >
                <option value="player">player</option>
                <option value="admin">admin</option>
              </select>
            </span>
            <span className="user-actions">
              <button
                className="btn btn-delete"
                onClick={() => handleDelete(u)}
                disabled={u.id === me.id}
              >
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
