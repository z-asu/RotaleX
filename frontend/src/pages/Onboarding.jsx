import React, { useState, useEffect } from 'react'
import { getGames, getTeams, completeOnboarding } from '../api'
import { RANKS } from '../images'

export default function Onboarding({ user, onDone }) {
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({
    nickname: user?.username || '',
    real_name: '',
    game_id: '',
    team_id: '',
    role: '',
    rank: '',
    main_hero: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([getGames(), getTeams()])
      .then(([g, t]) => { setGames(g); setTeams(t) })
      .catch(() => setError('Failed to load games'))
  }, [])

  const teamsForGame = form.game_id
    ? teams.filter((t) => t.game_id === Number(form.game_id))
    : []

  const selectedGameName = form.game_id
    ? (games.find((g) => g.id === Number(form.game_id)) || {}).name
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await completeOnboarding({
        nickname: form.nickname,
        real_name: form.real_name,
        game_id: form.game_id ? Number(form.game_id) : null,
        team_id: form.team_id ? Number(form.team_id) : null,
        role: form.role,
        rank: form.rank || null,
        main_hero: form.main_hero || null,
      })
      onDone(result.user)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="card onboarding-card">
        <h1 className="onboarding-title">Welcome to ROTALEX, {user?.username}!</h1>
        <p className="onboarding-sub">
          Kenalan dulu — isi data member kamu. Ini bisa diubah lagi nanti di halaman Profile.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nickname
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              required
              autoFocus
            />
          </label>
          <label>
            Real Name
            <input
              value={form.real_name}
              onChange={(e) => setForm({ ...form, real_name: e.target.value })}
              placeholder="Nama asli kamu"
            />
          </label>
          <label>
            Game yang kamu mainkan
            <select
              value={form.game_id}
              onChange={(e) => setForm({ ...form, game_id: e.target.value, team_id: '' })}
            >
              <option value="">Belum pilih game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.genre})</option>
              ))}
            </select>
          </label>
          <label>
            Team
            <select
              value={form.team_id}
              onChange={(e) => setForm({ ...form, team_id: e.target.value })}
            >
              <option value="">Belum masuk team</option>
              {teamsForGame.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label>
            Role / Posisi
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Contoh: Duelist, Midlaner, Racer..."
            />
          </label>
          <label>
            Rank
            <select
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
            >
              <option value="">Belum pilih rank</option>
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

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-add auth-submit" disabled={busy}>
            {busy ? 'Saving...' : 'Join ROTALEX'}
          </button>
        </form>
      </div>
    </div>
  )
}
