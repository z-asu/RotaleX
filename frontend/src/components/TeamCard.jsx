import React from 'react'

export default function TeamCard({ team, playerCount, onEdit, onDelete, onOpen }) {
  return (
    <div className="card team-card clickable" onClick={onOpen}>
      <div className="card-top">
        <h3 className="card-title">{team.name}</h3>
        <span className="genre-badge">{team.game_name}</span>
      </div>
      {team.description && <p className="card-desc">{team.description}</p>}
      <div className="card-meta">
        <span className="meta-players">{playerCount} Players</span>
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
