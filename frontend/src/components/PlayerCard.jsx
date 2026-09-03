import React from 'react'
import { getRankIcon, rankLabel } from '../images'

const BACKEND_URL = 'http://localhost:8080'

export default function PlayerCard({ player, onEdit, onDelete, onOpen }) {
  const avatarUrl = player.profile_image
    ? `${BACKEND_URL}${player.profile_image}`
    : null
  const rankIcon = player.game ? getRankIcon(player.game.name, player.rank) : null

  return (
    <div className="card player-card clickable" onClick={onOpen}>
      <div className="player-top">
        {avatarUrl ? (
          <img src={avatarUrl} alt={player.nickname} className="player-avatar-img" />
        ) : (
          <div className="player-avatar">{player.nickname.charAt(0).toUpperCase()}</div>
        )}
        <div className="player-info">
          <h3 className="card-title">{player.nickname}</h3>
          {player.role && <p className="player-role">{player.role}</p>}
          {player.main_hero && (
            <p className="player-hero">Main: {player.main_hero}</p>
          )}
          <div className="card-meta">
            <span className="meta-game">{player.game ? player.game.name : 'No Game'}</span>
            <span className="meta-team">
              {player.team ? player.team.name : 'No Team'}
            </span>
          </div>
        </div>
      </div>

      <div className="player-footer">
        <span className={`status-badge ${player.status === 'active' ? 'active' : 'inactive'}`}>
          {player.status}
        </span>
        {rankIcon ? (
          <span className="rank-badge-wrap" title={rankLabel(player.rank)}>
            <img src={rankIcon} alt={rankLabel(player.rank)} className="rank-icon" />
            <span className="rank-name">{rankLabel(player.rank)}</span>
          </span>
        ) : player.game ? (
          <span className="rank-badge-wrap unranked" title="Unranked">
            <span className="rank-name">UNRANKED</span>
          </span>
        ) : null}
      </div>

      {(onEdit || onDelete) && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && <button className="btn btn-edit" onClick={onEdit}>Edit</button>}
          {onDelete && <button className="btn btn-delete" onClick={onDelete}>Delete</button>}
        </div>
      )}
    </div>
  )
}
