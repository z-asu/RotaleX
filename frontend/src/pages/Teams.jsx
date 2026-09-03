import React, { useState, useEffect } from 'react'
import { getTeams, getGames, getPlayers, createTeam, updateTeam, deleteTeam } from '../api'
import { confirmDelete, showError, showToast } from '../swal'
import TeamCard from '../components/TeamCard'

const emptyForm = { name: '', game_id: '', description: '' }

export default function Teams({ isAdmin, onOpenTeam }) {
  const [teams, setTeams] = useState(null)
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [search, setSearch] = useState('')
  const [filterGame, setFilterGame] = useState('')

  async function load() {
    try {
      const [t, g, p] = await Promise.all([getTeams(), getGames(), getPlayers()])
      setTeams(t)
      setGames(g)
      setPlayers(p)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <p className="loading">Failed to load data.</p>
  if (!teams) return <p className="loading">Loading...</p>

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(team) {
    setForm({ name: team.name, game_id: String(team.game_id), description: team.description || '' })
    setEditingId(team.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = { ...form, game_id: Number(form.game_id) }
    try {
      if (editingId) {
        await updateTeam(editingId, payload)
        showToast('Team updated')
      } else {
        await createTeam(payload)
        showToast('Team added')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDelete(team) {
    const confirmed = await confirmDelete('Delete Team', `"${team.name}" will be permanently deleted.`)
    if (!confirmed) return
    try {
      await deleteTeam(team.id)
      showToast('Team deleted')
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  function playerCountForTeam(teamId) {
    return players.filter((p) => p.team && p.team.id === teamId).length
  }

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch = t.name.toLowerCase().includes(q) || t.game_name.toLowerCase().includes(q)
    const matchGame = !filterGame || String(t.game_id) === filterGame
    return matchSearch && matchGame
  })

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Teams</h1>
        {isAdmin && <button className="btn btn-add" onClick={openAdd}>+ Add Team</button>}
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterGame} onChange={(e) => setFilterGame(e.target.value)}>
          <option value="">All Games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="card-grid">
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            playerCount={playerCountForTeam(team.id)}
            onOpen={() => onOpenTeam(team.id)}
            onEdit={isAdmin ? () => openEdit(team) : undefined}
            onDelete={isAdmin ? () => handleDelete(team) : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && <p className="loading">No teams found.</p>}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Team' : 'Add Team'}</h2>
            <form onSubmit={handleSave}>
              <label>
                Team Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Game
                <select
                  value={form.game_id}
                  onChange={(e) => setForm({ ...form, game_id: e.target.value })}
                  required
                >
                  <option value="">Select game</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
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
