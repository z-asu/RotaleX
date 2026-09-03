import React, { useEffect, useState } from 'react'
import { getPlayer, getTeam, getPlayers, backendUrl } from '../api'
import { getGameImage, getRankIcon, rankLabel } from '../images'

export default function PlayerDetail({ playerId, onBack }) {
  const [player, setPlayer] = useState(null)
  const [teammates, setTeammates] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    getPlayer(playerId)
      .then((p) => {
        setPlayer(p)
        if (p.team) {
          getPlayers().then((all) =>
            setTeammates(all.filter((x) => x.team && x.team.id === p.team.id && x.id !== p.id))
          )
        }
      })
      .catch(() => setError(true))
  }, [playerId])

  const backBtn = (
    <button className="btn btn-edit back-btn" onClick={onBack}>← Back to Players</button>
  )

  if (error) return <div>{backBtn}<p className="loading">Failed to load data.</p></div>
  if (!player) return <div>{backBtn}<p className="loading">Loading...</p></div>

  const avatarUrl = player.profile_image
    ? backendUrl(player.profile_image)
    : null
  const gameImg = player.game ? getGameImage(player.game.name) : null
  const rankIcon = player.game ? getRankIcon(player.game.name, player.rank) : null

  return (
    <div>
      {backBtn}

      <div className="card detail-card ingame-card">
        {gameImg && (
          <>
            <div
              className="ingame-bg"
              style={{ backgroundImage: `url(${gameImg})` }}
            />
            <div className="ingame-overlay" />
          </>
        )}

        <div className="ingame-content">
          <div className="detail-header">
            {avatarUrl ? (
              <img src={avatarUrl} alt={player.nickname} className="ingame-avatar-img" />
            ) : (
              <div className="ingame-avatar">{player.nickname.charAt(0).toUpperCase()}</div>
            )}
            <div>
              <h1 className="detail-title">{player.nickname}</h1>
              {player.real_name && <p className="detail-subname">{player.real_name}</p>}
              <div className="detail-badges">
                <span className={`role-badge ${player.role === 'admin' ? 'admin' : 'player'}`}>
                  {player.role}
                </span>
                <span className={`status-badge ${player.status === 'active' ? 'active' : 'inactive'}`}>
                  {player.status}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Game</span>
              <span className="detail-value">
                {player.game ? player.game.name : '—'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Team</span>
              <span className="detail-value">{player.team ? player.team.name : 'No Team'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">{player.role || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Main Hero</span>
              <span className="detail-value">{player.main_hero || '—'}</span>
            </div>
          </div>

          {rankIcon && (
            <div className="rank-showcase">
              <img src={rankIcon} alt={rankLabel(player.rank)} className="rank-showcase-icon" />
              <div className="rank-showcase-info">
                <span className="detail-label">Current Rank</span>
                <span className="rank-showcase-name">{rankLabel(player.rank)}</span>
                <span className="rank-showcase-game">{player.game.name}</span>
              </div>
            </div>
          )}

          {player.team && teammates.length > 0 && (
            <div>
              <h2 className="roster-title">Teammates — {player.team.name}</h2>
              <div className="roster-list">
                {teammates.map((t) => {
                  const tmAvatar = t.profile_image ? backendUrl(t.profile_image) : null
                  return (
                    <div key={t.id} className="roster-item">
                      {tmAvatar ? (
                        <img src={tmAvatar} alt={t.nickname} className="roster-img" />
                      ) : (
                        <span className="roster-fallback">{t.nickname.charAt(0).toUpperCase()}</span>
                      )}
                      <div>
                        <span className="roster-name">{t.nickname}</span>
                        <span className="roster-role">{t.role || '—'}</span>
                      </div>
                      <span className={`status-badge ${t.status === 'active' ? 'active' : 'inactive'}`}>
                        {t.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
