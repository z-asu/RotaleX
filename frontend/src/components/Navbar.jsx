import React, { useState } from 'react'
import { backendUrl } from '../api'

export default function Navbar({ page, onNavigate, user, onLogout, isAdmin, theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const pages = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'games', label: 'Games' },
    { key: 'teams', label: 'Teams' },
    { key: 'players', label: 'Players' },
    ...(isAdmin ? [{ key: 'users', label: 'Users' }] : []),
  ]

  function go(key) {
    onNavigate(key)
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => go('dashboard')}>
          <img src="/images/Rotalex.png" alt="ROTALEX" className="brand-logo" />
          <span className="brand-text">ROTALEX</span>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {pages.map((p) => (
            <button
              key={p.key}
              className={`nav-link ${page === p.key ? 'active' : ''}`}
              onClick={() => go(p.key)}
            >
              {p.label}
            </button>
          ))}

          <button
            className="nav-link theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          {user ? (
            <div className="nav-user">
              <span className={`role-badge ${user.role}`}>{user.role}</span>
              <button
                className={`nav-avatar-btn ${page === 'profile' ? 'active' : ''}`}
                onClick={() => go('profile')}
                title="Profile"
                aria-label="Profile"
              >
                {user.profile_image ? (
                  <img
                    src={backendUrl(user.profile_image)}
                    alt={user.username}
                    className="nav-avatar-img"
                  />
                ) : (
                  <span className="nav-avatar-fallback">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              <button className="nav-link logout-link" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button
              className={`nav-link ${page === 'login' ? 'active' : ''}`}
              onClick={() => go('login')}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
