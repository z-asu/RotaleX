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

1. **Backend → Koyeb** (gratis, tanpa kartu)
   - Daftar/login koyeb.com (pakai akun GitHub)
   - Create App → **GitHub** → pilih repo `RotaleX`
   - Builder: **Dockerfile** | Path: `/backend`
   - App name: `rotalex-api` | Instance: Free | Port: `8080` (HTTP)
   - Environment variables (Add variable):
     - `DATABASE_URL` = URL Neon PostgreSQL
     - `JWT_SECRET` = secret acak
   - Create/Deploy → tunggu build (~3-5 menit)
   - Copy URL publik (mis. `https://rotalex-api-xxxx.koyeb.app`)

2. **Frontend → Vercel**
   - vercel.com → Add New Project → import repo `RotaleX`
   - Root Directory: `frontend` (Framework auto-detect: Vite)
   - Environment Variable: `VITE_API_URL` = URL Koyeb dari langkah 1
   - Deploy → dapat URL `https://rotalex.vercel.app`

Catatan: instance Koyeb free bisa sleep saat idle — request pertama lambat beberapa detik (normal). Foto profil tersimpan di disk instance (ephemeral); data DB aman.
