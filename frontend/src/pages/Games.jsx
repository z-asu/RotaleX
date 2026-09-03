import React, { useState, useEffect } from 'react'
import { getGames, getTeams, getPlayers, createGame, updateGame, deleteGame } from '../api'
import { confirmDelete, showError, showToast } from '../swal'
import GameCard from '../components/GameCard'

const emptyForm = { name: '', genre: 'FPS', description: '' }

export default function Games({ isAdmin }) {
  const [games, setGames] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [search, setSearch] = useState('')
  const [filterGenre, setFilterGenre] = useState('')

  async function load() {
    try {
      const [g, t, p] = await Promise.all([getGames(), getTeams(), getPlayers()])
      setGames(g)
      setTeams(t)
      setPlayers(p)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <p className="loading">Failed to load data.</p>
  if (!games) return <p className="loading">Loading...</p>

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(game) {
    setForm({ name: game.name, genre: game.genre, description: game.description || '' })
    setEditingId(game.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await updateGame(editingId, form)
        showToast('Game updated')
      } else {
        await createGame(form)
        showToast('Game added')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDelete(game) {
    const confirmed = await confirmDelete('Delete Game', `"${game.name}" will be permanently deleted.`)
    if (!confirmed) return
    try {
      await deleteGame(game.id)
      showToast('Game deleted')
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  function teamForGame(gameId) {
    return teams.find((t) => t.game_id === gameId)
  }

  function playerCountForGame(gameId) {
    return players.filter((p) => p.game && p.game.id === gameId).length
  }

  const filtered = games.filter((g) => {
    const q = search.toLowerCase()
    const matchSearch =
      g.name.toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q)
    const matchGenre = !filterGenre || g.genre === filterGenre
    return matchSearch && matchGenre
  })

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Games</h1>
        {isAdmin && <button className="btn btn-add" onClick={openAdd}>+ Add Game</button>}
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search game..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
          <option value="">All Genres</option>
          <option value="FPS">FPS</option>
          <option value="MOBA">MOBA</option>
          <option value="Racing">Racing</option>
        </select>
      </div>

      <p className="result-count">{filtered.length} game{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="card-grid">
        {filtered.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            teamName={teamForGame(game.id)?.name}
            playerCount={playerCountForGame(game.id)}
            onEdit={isAdmin ? () => openEdit(game) : undefined}
            onDelete={isAdmin ? () => handleDelete(game) : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && <p className="loading">No games found.</p>}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Game' : 'Add Game'}</h2>
            <form onSubmit={handleSave}>
              <label>
                Game Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Genre
                <select
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                >
                  <option value="FPS">FPS</option>
                  <option value="MOBA">MOBA</option>
                  <option value="Racing">Racing</option>
                </select>
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
