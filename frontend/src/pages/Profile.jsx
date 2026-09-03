import React, { useState, useEffect } from 'react'
import {
  getMe,
  updateMe,
  changePassword,
  uploadProfileImage,
  getMyPlayer,
  updateMyPlayer,
  getGames,
  getTeams,
  getCurrentUser,
  setCurrentUser,
  backendUrl,
} from '../api'
import { showToast, showError } from '../swal'
import { RANKS, getRankIcon, rankLabel } from '../images'

export default function Profile({ onUserUpdated }) {
  const [form, setForm] = useState({ username: '', email: '' })
  const [pwd, setPwd] = useState({ password: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [me, setMe] = useState(getCurrentUser())

  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [playerForm, setPlayerForm] = useState({
    nickname: '',
    real_name: '',
    game_id: '',
    team_id: '',
    role: '',
    rank: '',
    main_hero: '',
  })

  useEffect(() => {
    if (me) setForm({ username: me.username, email: me.email })
    Promise.all([getGames(), getTeams(), getMyPlayer()])
      .then(([g, t, p]) => {
        setGames(g)
        setTeams(t)
        setMyPlayer(p)
        setPlayerForm({
          nickname: p.nickname || '',
          real_name: p.real_name || '',
          game_id: p.game ? String(p.game.id) : '',
          team_id: p.team ? String(p.team.id) : '',
          role: p.role || '',
          rank: p.rank || '',
          main_hero: p.main_hero || '',
        })
      })
      .catch(() => {
        // player belum ada — biarkan kosong
      })
  }, [])

  function applyUser(user) {
    setCurrentUser(user)
    setMe(user)
    onUserUpdated(user)
  }

  async function handleSave(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    try {
      const updated = await updateMe(form.username, form.email)
      applyUser(updated)
      setMsg('Profile updated')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function handleImageChange(e) {
    setErr('')
    setMsg('')
    const file = e.target.files[0]
    if (!file) return
    try {
      const updated = await uploadProfileImage(file)
      applyUser(updated)
      setMsg('Profile photo updated')
    } catch (e2) {
      setErr(e2.message)
    }
    e.target.value = ''
  }

  async function handlePassword(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (pwd.password !== pwd.confirm) {
      setErr('Password does not match')
      return
    }
    try {
      await changePassword(pwd.password)
      setPwd({ password: '', confirm: '' })
      setMsg('Password updated')
    } catch (e2) {
      setErr(e2.message)
    }
  }

  async function handleSavePlayer(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    try {
      const updated = await updateMyPlayer({
        nickname: playerForm.nickname,
        real_name: playerForm.real_name,
        game_id: playerForm.game_id ? Number(playerForm.game_id) : null,
        team_id: playerForm.team_id ? Number(playerForm.team_id) : null,
        role: playerForm.role,
        rank: playerForm.rank || null,
        main_hero: playerForm.main_hero || null,
        status: myPlayer?.status || 'active',
      })
      setMyPlayer(updated)
      showToast('Player info updated')
    } catch (e2) {
      showError(e2.message)
    }
  }

  const teamsForGame = playerForm.game_id
    ? teams.filter((t) => t.game_id === Number(playerForm.game_id))
    : []

  const selectedGameName = playerForm.game_id
    ? (games.find((g) => g.id === Number(playerForm.game_id)) || {}).name
    : null

  const myRankIcon = selectedGameName
    ? getRankIcon(selectedGameName, playerForm.rank)
    : null

  const avatarUrl =
    me && me.profile_image
      ? backendUrl(me.profile_image)
      : null

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="card profile-card">
          {avatarUrl ? (
            <img src={avatarUrl} alt={me?.username} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {me ? me.username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <h2 className="profile-username">{me?.username}</h2>
          <span className={`role-badge ${me?.role}`}>{me?.role}</span>
          <p className="profile-email">{me?.email}</p>

          <label className="upload-btn-wrap">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <span className="btn btn-edit upload-btn">
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </span>
          </label>
          <p className="upload-hint">JPG/PNG/WebP, max 2MB</p>
        </div>

        <div className="card profile-form-card">
          <h2 className="profile-form-title">Edit Profile</h2>
          <form onSubmit={handleSave} className="auth-form">
            <label>
              Username
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn btn-save">Save Profile</button>
          </form>
        </div>

        <div className="card profile-form-card">
          <h2 className="profile-form-title">Change Password</h2>
          <form onSubmit={handlePassword} className="auth-form">
            <label>
              New Password
              <input
                type="password"
                value={pwd.password}
                onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
                required
                minLength={6}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                required
                minLength={6}
              />
            </label>
            <button type="submit" className="btn btn-save">Change Password</button>
          </form>
        </div>

        <div className="card profile-form-card player-info-card">
          <h2 className="profile-form-title">Player Info</h2>
          <p className="player-info-hint">
            Data member kamu yang tampil di halaman Players — bebas kamu ubah sendiri.
          </p>
          <form onSubmit={handleSavePlayer} className="auth-form">
            <label>
              Nickname
              <input
                value={playerForm.nickname}
                onChange={(e) => setPlayerForm({ ...playerForm, nickname: e.target.value })}
                required
              />
            </label>
            <label>
              Real Name
              <input
                value={playerForm.real_name}
                onChange={(e) => setPlayerForm({ ...playerForm, real_name: e.target.value })}
              />
            </label>
            <label>
              Game
              <select
                value={playerForm.game_id}
                onChange={(e) => setPlayerForm({ ...playerForm, game_id: e.target.value, team_id: '' })}
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
                value={playerForm.team_id}
                onChange={(e) => setPlayerForm({ ...playerForm, team_id: e.target.value })}
              >
                <option value="">No Team</option>
                {teamsForGame.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label>
              Role / Posisi
              <input
                value={playerForm.role}
                onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                placeholder="Duelist, Midlaner, Racer..."
              />
            </label>
            <label>
              Rank
              <select
                value={playerForm.rank}
                onChange={(e) => setPlayerForm({ ...playerForm, rank: e.target.value })}
              >
                <option value="">No Rank</option>
                {(RANKS[selectedGameName?.toLowerCase()] || []).map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
              {myRankIcon && (
                <span className="form-rank-preview">
                  <img src={myRankIcon} alt={rankLabel(playerForm.rank)} />
                </span>
              )}
            </label>
            <label>
              Main Hero / Character
              <input
                value={playerForm.main_hero}
                onChange={(e) => setPlayerForm({ ...playerForm, main_hero: e.target.value })}
                placeholder="Gusion, Ling, Jett..."
              />
            </label>
            {myPlayer && (
              <p className="player-info-status">
                Status: <span className={`status-badge ${myPlayer.status === 'active' ? 'active' : 'inactive'}`}>{myPlayer.status}</span>
              </p>
            )}
            <button type="submit" className="btn btn-save">Save Player Info</button>
          </form>
        </div>
      </div>

      {msg && <p className="profile-msg ok">{msg}</p>}
      {err && <p className="profile-msg err">{err}</p>}
    </div>
  )
}
