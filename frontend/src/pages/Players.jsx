import React, { useState, useEffect } from 'react'
import { getPlayers, getGames, getTeams, createPlayer, updatePlayer, deletePlayer } from '../api'
import { confirmDelete, showError, showToast } from '../swal'
import { RANKS } from '../images'
import PlayerCard from '../components/PlayerCard'

const emptyForm = { nickname: '', real_name: '', game_id: '', team_id: '', role: '', rank: '', main_hero: '', status: 'active' }
const PAGE_SIZE = 9

export default function Players({ isAdmin, onOpenPlayer }) {
  const [players, setPlayers] = useState(null)
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [search, setSearch] = useState('')
  const [filterGame, setFilterGame] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  async function load() {
    try {
      const [p, g, t] = await Promise.all([getPlayers(), getGames(), getTeams()])
      setPlayers(p)
      setGames(g)
      setTeams(t)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <p className="loading">Failed to load data.</p>
  if (!players) return <p className="loading">Loading...</p>

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(player) {
    setForm({
      nickname: player.nickname,
      real_name: player.real_name || '',
      game_id: player.game ? String(player.game.id) : '',
      team_id: player.team ? String(player.team.id) : '',
      role: player.role || '',
      rank: player.rank || '',
      main_hero: player.main_hero || '',
      status: player.status,
    })
    setEditingId(player.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      ...form,
      game_id: form.game_id ? Number(form.game_id) : null,
      team_id: form.team_id ? Number(form.team_id) : null,
      rank: form.rank || null,
      main_hero: form.main_hero || null,
    }
    try {
      if (editingId) {
        await updatePlayer(editingId, payload)
        showToast('Player updated')
      } else {
        await createPlayer(payload)
        showToast('Player added')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDelete(player) {
    const confirmed = await confirmDelete('Delete Player', `"${player.nickname}" will be permanently deleted.`)
    if (!confirmed) return
    try {
      await deletePlayer(player.id)
      showToast('Player deleted')
      load()
    } catch (err) {
      showError(err.message)
    }
  }

  const filtered = players.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch =
      p.nickname.toLowerCase().includes(q) ||
      (p.real_name || '').toLowerCase().includes(q) ||
      (p.team && p.team.name.toLowerCase().includes(q))
    const matchGame = !filterGame || (p.game && String(p.game.id) === filterGame)
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchGame && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagePlayers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function changePage(next) {
    const p = Math.min(Math.max(1, next), totalPages)
    setPage(p)
  }

  const teamsForGame = form.game_id
    ? teams.filter((t) => t.game_id === Number(form.game_id))
    : []

  const selectedGameName = form.game_id
    ? (games.find((g) => g.id === Number(form.game_id)) || {}).name
    : null

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Players</h1>
        {isAdmin && <button className="btn btn-add" onClick={openAdd}>+ Add Player</button>}
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search nickname, name, team..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <select value={filterGame} onChange={(e) => { setFilterGame(e.target.value); setPage(1) }}>
          <option value="">All Games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="benched">Benched</option>
        </select>
      </div>

      <p className="result-count">{filtered.length} player{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="card-grid players-grid">
        {pagePlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onOpen={() => onOpenPlayer(player.id)}
            onEdit={isAdmin ? () => openEdit(player) : undefined}
            onDelete={isAdmin ? () => handleDelete(player) : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && <p className="loading">No players found.</p>}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-edit" onClick={() => changePage(safePage - 1)} disabled={safePage === 1}>Prev</button>
          <span className="page-info">{safePage} / {totalPages}</span>
          <button className="btn btn-edit" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages}>Next</button>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Player' : 'Add Player'}</h2>
            <form onSubmit={handleSave}>
              <label>
                Nickname
                  <input
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    required
                  />
              </label>
              <label>
                Real Name
                <input
                  value={form.real_name}
                  onChange={(e) => setForm({ ...form, real_name: e.target.value })}
                />
              </label>
              <label>
                Game
                <select
                  value={form.game_id}
                  onChange={(e) => setForm({ ...form, game_id: e.target.value, team_id: '' })}
                >
                  <option value="">No Game</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Team
                <select
                  value={form.team_id}
                  onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                >
                  <option value="">No Team</option>
                  {teamsForGame.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Role
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </label>
              <label>
                Rank
                <select
                  value={form.rank}
                  onChange={(e) => setForm({ ...form, rank: e.target.value })}
                >
                  <option value="">No Rank</option>
                  {(RANKS[selectedGameName?.toLowerCase()] || []).map((r) => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>
              </label>
              <label>
                Main Hero / Character
                <input
                  value={form.main_hero}
                  onChange={(e) => setForm({ ...form, main_hero: e.target.value })}
                  placeholder="Contoh: Gusion, Ling, Jett..."
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="benched">Benched</option>
                </select>
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
