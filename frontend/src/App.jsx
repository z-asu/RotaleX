import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Users from './pages/Users'
import Login from './pages/Login'
import Welcome from './pages/Welcome'
import Profile from './pages/Profile'
import PlayerDetail from './pages/PlayerDetail'
import TeamDetail from './pages/TeamDetail'
import Onboarding from './pages/Onboarding'
import { getCurrentUser, setCurrentUser, logout as apiLogout, isAdmin } from './api'
import { initTheme, toggleTheme, getTheme } from './theme'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [authPage, setAuthPage] = useState(null) // null | 'login' | 'register'
  const [detailId, setDetailId] = useState(null) // player/team id untuk halaman detail
  const [theme, setTheme] = useState(getTheme())

  useEffect(() => {
    initTheme()
    const current = getCurrentUser()
    if (current) setUser(current)
  }, [])

  function handleTheme() {
    setTheme(toggleTheme())
  }

  function handleLogin(user) {
    setUser(user)
    setAuthPage(null)
    setPage('dashboard')
  }

  function handleLogout() {
    apiLogout()
    setUser(null)
    setAuthPage(null)
    setDetailId(null)
  }

  function refreshUser(user) {
    if (user) {
      setCurrentUser(user)
      setUser(user)
    } else {
      setUser(getCurrentUser())
    }
  }

  function navigate(key) {
    setPage(key)
    setDetailId(null)
  }

  function openPlayerDetail(id) {
    setPage('player-detail')
    setDetailId(id)
  }

  function openTeamDetail(id) {
    setPage('team-detail')
    setDetailId(id)
  }

  const admin = isAdmin()

  // Belum login: Welcome / Login / Register
  if (!user) {
    return (
      <div className="app">
        <button
          className="theme-toggle fixed-theme-toggle"
          onClick={handleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        {authPage ? (
          <main className="container">
            <Login onLogin={handleLogin} initialMode={authPage} />
          </main>
        ) : (
          <Welcome
            onLoginClick={() => setAuthPage('login')}
            onRegisterClick={() => setAuthPage('register')}
          />
        )}
        <footer className="footer">
          <p>ROTALEX Gaming Club</p>
        </footer>
      </div>
    )
  }

  // Sudah login: aplikasi utama
  // User baru belum onboarding → tampilkan form perkenalan dulu
  if (!user.onboarded) {
    return (
      <div className="app">
        <Onboarding user={user} onDone={refreshUser} />
        <footer className="footer">
          <p>ROTALEX Gaming Club</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar
        page={page}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
        isAdmin={admin}
        theme={theme}
        onToggleTheme={handleTheme}
      />
      <main className="container">
        {page === 'dashboard' && <Dashboard onOpenPlayer={openPlayerDetail} />}
        {page === 'games' && <Games isAdmin={admin} />}
        {page === 'teams' && <Teams isAdmin={admin} onOpenTeam={openTeamDetail} />}
        {page === 'players' && <Players isAdmin={admin} onOpenPlayer={openPlayerDetail} />}
        {page === 'player-detail' && (
          <PlayerDetail playerId={detailId} onBack={() => navigate('players')} />
        )}
        {page === 'team-detail' && (
          <TeamDetail teamId={detailId} onBack={() => navigate('teams')} />
        )}
        {page === 'users' && admin && <Users onRoleChanged={refreshUser} />}
        {page === 'profile' && <Profile onUserUpdated={refreshUser} />}
      </main>
      <footer className="footer">
        <p>ROTALEX Gaming Club</p>
      </footer>
    </div>
  )
}
