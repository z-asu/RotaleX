# ROTALEX Gaming Club

Demo aplikasi gaming/e-sports club: Go+Gin backend, React+Vite frontend, PostgreSQL (Neon).

## Struktur

```
backend/   Go + Gin REST API (JWT auth, CRUD games/teams/players)
frontend/  React + Vite SPA
images/    Aset gambar asli (sudah dicopy ke frontend/public)
```

## Jalankan lokal

```bash
# 1. Backend
cd backend
copy .env.example .env   # isi DATABASE_URL & JWT_SECRET
go run .

# 2. Frontend
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:8080
- Frontend: http://localhost:5173

## Deploy

1. **Backend → Render**
   - New Web Service → pilih repo ini, Root Directory: `backend`
   - Build: `go build -o rotalex .` | Start: `./rotalex`
   - Env vars: `DATABASE_URL`, `JWT_SECRET` (PORT otomatis dari Render)

2. **Frontend → Vercel**
   - Import repo, Root Directory: `frontend`
   - Env var: `VITE_API_URL` = URL backend Render (mis. `https://rotalex-api.onrender.com`)

Catatan: storage Render free tier ephemeral — foto profil upload hilang saat redeploy (data DB aman).
