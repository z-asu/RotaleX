import React, { useState, useEffect } from 'react'
import { getDashboard, getGames, getPlayers, backendUrl } from '../api'
import { getGameImage } from '../images'

export default function Dashboard({ onOpenPlayer }) {
  const [stats, setStats] = useState(null)
  const [games, setGames] = useState(null)
  const [players, setPlayers] = useState(null)
  const [error, setError] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    getDashboard().then(setStats).catch(() => setError(true))
    getGames().then(setGames).catch(() => setError(true))
    getPlayers().then(setPlayers).catch(() => setError(true))
  }, [])

  const heroImages = (games || [])
    .map((g) => getGameImage(g.name))
    .filter(Boolean)

  useEffect(() => {
    if (heroImages.length < 2) return
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  if (error) return <p className="loading">Failed to load data.</p>
  if (!stats || !games || !players) return <p className="loading">Loading...</p>

  const byGenre = {}
  for (const game of games) {
    if (!byGenre[game.genre]) byGenre[game.genre] = []
    byGenre[game.genre].push(game)
  }

  const countForGame = (gameId) => players.filter((p) => p.game && p.game.id === gameId).length
  const maxCount = Math.max(1, ...games.map((g) => countForGame(g.id)))

  const recentPlayers = [...players].sort((a, b) => b.id - a.id).slice(0, 5)

  return (
    <div>
      <div className="hero hero-slide">
        {heroImages.map((img, i) => (
          <React.Fragment key={img}>
            <div
              className={`hero-bg-blur ${i === slide ? 'show' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
            <div
              className={`hero-bg ${i === slide ? 'show' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          </React.Fragment>
        ))}
        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 className="hero-title">ROTALEX</h1>
          <p className="hero-sub">Gaming Club</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">{stats.games}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.teams}</span>
              <span className="stat-label">Teams</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.players}</span>
              <span className="stat-label">Players</span>
            </div>
          </div>
        </div>

        {heroImages.length > 1 && (
          <div className="hero-dots">
            {heroImages.map((img, i) => (
              <button
                key={img}
                className={`hero-dot ${i === slide ? 'active' : ''}`}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="dash-columns">
        <div className="dash-main">
          {Object.keys(byGenre).map((genre) => (
            <section key={genre} className="genre-section">
              <h2 className="genre-title">{genre}</h2>
              <div className="genre-list">
                {byGenre[genre].map((game) => {
                  const img = getGameImage(game.name)
                  return (
                    <div key={game.id} className="genre-item">
                      {img && <img src={img} alt={game.name} className="genre-item-img" />}
                      <span>{game.name}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="genre-section">
            <h2 className="genre-title">Players per Game</h2>
            <div className="bar-list">
              {games.map((g) => {
                const count = countForGame(g.id)
                return (
                  <div key={g.id} className="bar-row">
                    <span className="bar-label">{g.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="dash-side">
          <div className="card recent-card">
            <h2 className="recent-title">Recent Players</h2>
            {recentPlayers.length === 0 ? (
              <p className="recent-empty">No players yet.</p>
            ) : (
              recentPlayers.map((p) => {
                const avatarUrl = p.profile_image ? backendUrl(p.profile_image) : null
                return (
                  <button
                    key={p.id}
                    className="recent-item"
                    onClick={() => onOpenPlayer && onOpenPlayer(p.id)}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={p.nickname} className="recent-img" />
                    ) : (
                      <span className="recent-fallback">
                        {p.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="recent-name">{p.nickname}</span>
                    <span className="recent-game">
                      {p.game ? p.game.name : 'No Game'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
