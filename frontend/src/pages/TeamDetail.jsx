import React, { useEffect, useState } from 'react'
import { getTeam, getPlayers, backendUrl } from '../api'
import { getGameImage } from '../images'

export default function TeamDetail({ teamId, onBack }) {
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([getTeam(teamId), getPlayers()])
      .then(([t, p]) => {
        setTeam(t)
        setPlayers(p.filter((pl) => pl.team && pl.team.id === Number(teamId)))
      })
      .catch(() => setError(true))
  }, [teamId])

  if (error) return (
    <div>
      <button className="btn btn-edit back-btn" onClick={onBack}>← Back</button>
      <p className="loading">Failed to load data.</p>
    </div>
  )
  if (!team || !players) return (
    <div>
      <button className="btn btn-edit back-btn" onClick={onBack}>← Back</button>
      <p className="loading">Loading...</p>
    </div>
  )

  const gameImg = getGameImage(team.game_name)

  return (
    <div>
      <button className="btn btn-edit back-btn" onClick={onBack}>← Back to Teams</button>

      <div className="card detail-card">
        <div className="detail-header">
          {gameImg ? (
            <img src={gameImg} alt={team.game_name} className="detail-avatar-img" />
          ) : (
            <div className="detail-avatar">{team.name.charAt(0)}</div>
          )}
          <div>
            <h1 className="detail-title">{team.name}</h1>
            <p className="detail-subname">{team.game_name} ({team.genre})</p>
            {team.description && <p className="detail-desc">{team.description}</p>}
          </div>
        </div>

        <h2 className="roster-title">Roster ({players.length})</h2>

        {players.length === 0 ? (
          <p className="loading">No players in this team yet.</p>
        ) : (
          <div className="roster-list">
            {players.map((p) => {
              const avatarUrl = p.profile_image ? backendUrl(p.profile_image) : null
              return (
                <div key={p.id} className="roster-item">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={p.nickname} className="roster-img" />
                  ) : (
                    <span className="roster-fallback">{p.nickname.charAt(0).toUpperCase()}</span>
                  )}
                  <div>
                    <span className="roster-name">{p.nickname}</span>
                    <span className="roster-role">{p.role || '—'}</span>
                  </div>
                  <span className={`status-badge ${p.status === 'active' ? 'active' : 'inactive'}`}>
                    {p.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
