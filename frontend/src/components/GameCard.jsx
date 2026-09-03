import React from 'react'
import { getGameImage } from '../images'

const genreClass = {
  FPS: 'genre-fps',
  MOBA: 'genre-moba',
  Racing: 'genre-racing',
}

export default function GameCard({ game, teamName, playerCount, onEdit, onDelete }) {
  const img = getGameImage(game.name)

  return (
    <div className="card game-card">
      {img ? (
        <div className="card-image">
          <img src={img} alt={game.name} />
        </div>
      ) : (
        <div className="card-image card-image-fallback">
          <span>{game.name.charAt(0)}</span>
        </div>
      )}
      <div className="card-top">
        <h3 className="card-title">{game.name}</h3>
        <span className={`genre-badge ${genreClass[game.genre] || ''}`}>{game.genre}</span>
      </div>
      {game.description && <p className="card-desc">{game.description}</p>}
      <div className="card-meta">
        {teamName && <span className="meta-team">{teamName}</span>}
        <span className="meta-players">{playerCount} Players</span>
      </div>
      {(onEdit || onDelete) && (
        <div className="card-actions">
          {onEdit && <button className="btn btn-edit" onClick={onEdit}>Edit</button>}
          {onDelete && <button className="btn btn-delete" onClick={onDelete}>Delete</button>}
        </div>
      )}
    </div>
  )
}
