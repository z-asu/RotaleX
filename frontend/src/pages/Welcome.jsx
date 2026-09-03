import React from 'react'

export default function Welcome({ onLoginClick, onRegisterClick }) {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <img src="/images/Rotalex.png" alt="ROTALEX logo" className="welcome-logo" />
        <h1 className="welcome-title">ROTALEX</h1>
        <p className="welcome-sub">Gaming Club</p>

        <div className="welcome-actions">
          <button className="btn btn-add welcome-btn" onClick={onLoginClick}>
            Login
          </button>
          <button className="btn welcome-btn welcome-register" onClick={onRegisterClick}>
            Register
          </button>
        </div>
      </div>
    </div>
  )
}
