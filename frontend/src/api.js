export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080"
const API_URL = `${API_BASE}/api`;

// URL lengkap untuk asset dari backend (mis. foto profil /uploads/...)
export function backendUrl(path) {
  return `${API_BASE}${path}`
}

function getToken() {
  return localStorage.getItem("token")
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
}

// Auth
export function login(username, password) {
  return request("/login", { method: "POST", body: JSON.stringify({ username, password }) })
}

export function register(username, email, password) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  })
}

export function getMe() {
  return request("/me")
}

export function updateMe(username, email) {
  return request("/me", {
    method: "PUT",
    body: JSON.stringify({ username, email }),
  })
}

export async function uploadProfileImage(file) {
  const formData = new FormData()
  formData.append("image", file)
  const response = await fetch(`${API_URL}/me/image`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "Upload failed")
  }
  return response.json()
}

// Onboarding & my player
export function completeOnboarding(data) {
  return request("/me/onboarding", { method: "POST", body: JSON.stringify(data) })
}

export function getMyPlayer() {
  return request("/me/player")
}

export function updateMyPlayer(data) {
  return request("/me/player", { method: "PUT", body: JSON.stringify(data) })
}

export function changePassword(password) {
  return request("/me/password", { method: "PUT", body: JSON.stringify({ password }) })
}

// Users (admin)
export function getUsers() {
  return request("/users")
}

export function updateUserRole(id, role) {
  return request(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) })
}

export function deleteUser(id) {
  return request(`/users/${id}`, { method: "DELETE" })
}

// Auth state helpers
export function saveAuth(data) {
  localStorage.setItem("token", data.token)
  localStorage.setItem("user", JSON.stringify(data.user))
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export function getCurrentUser() {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export function setCurrentUser(user) {
  localStorage.setItem("user", JSON.stringify(user))
}

export function isAdmin() {
  const user = getCurrentUser()
  return user && user.role === "admin"
}

// Dashboard
export function getDashboard() {
  return request("/dashboard");
}

// Games
export function getGames() {
  return request("/games");
}

export function getGame(id) {
  return request(`/games/${id}`);
}

export function createGame(game) {
  return request("/games", { method: "POST", body: JSON.stringify(game) });
}

export function updateGame(id, game) {
  return request(`/games/${id}`, { method: "PUT", body: JSON.stringify(game) });
}

export function deleteGame(id) {
  return request(`/games/${id}`, { method: "DELETE" });
}

// Teams
export function getTeams() {
  return request("/teams");
}

export function getTeam(id) {
  return request(`/teams/${id}`);
}

export function createTeam(team) {
  return request("/teams", { method: "POST", body: JSON.stringify(team) });
}

export function updateTeam(id, team) {
  return request(`/teams/${id}`, { method: "PUT", body: JSON.stringify(team) });
}

export function deleteTeam(id) {
  return request(`/teams/${id}`, { method: "DELETE" });
}

// Players
export function getPlayers() {
  return request("/players");
}

export function getPlayer(id) {
  return request(`/players/${id}`);
}

export function createPlayer(player) {
  return request("/players", { method: "POST", body: JSON.stringify(player) });
}

export function updatePlayer(id, player) {
  return request(`/players/${id}`, { method: "PUT", body: JSON.stringify(player) });
}

export function deletePlayer(id) {
  return request(`/players/${id}`, { method: "DELETE" });
}
