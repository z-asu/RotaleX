package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

func loadEnv() {
	// Env var platform selalu menang
	if os.Getenv("DATABASE_URL") != "" {
		return
	}

	// Cari .env: working dir, beberapa path umum, lalu scan /app
	candidates := []string{
		".env",
		"./app/.env",
		"./src/.env",
		"./backend/.env",
		"/app/.env",
		"/app/app/.env",
		"/app/src/.env",
		"/app/backend/.env",
	}
	for _, path := range candidates {
		if data, err := os.ReadFile(path); err == nil {
			applyEnvFile(data)
			if os.Getenv("DATABASE_URL") != "" {
				return
			}
		}
	}

	// Scan /app secara rekursif (maksimal 3 level)
	filepath.Walk("/app", func(path string, info os.FileInfo, err error) error {
		if err != nil || info == nil || info.IsDir() {
			return nil
		}
		if info.Name() == ".env" {
			if data, err := os.ReadFile(path); err == nil {
				applyEnvFile(data)
			}
		}
		return nil
	})
}

func applyEnvFile(data []byte) {
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if i := strings.Index(line, "="); i > 0 {
			key := strings.TrimSpace(line[:i])
			value := strings.TrimSpace(line[i+1:])
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}

func connectDB() *sql.DB {
	loadEnv()

	url := os.Getenv("DATABASE_URL")
	if url == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	database, err := sql.Open("pgx", url)
	if err != nil {
		log.Fatal("failed to open database: ", err)
	}

	// Neon free tier memutus koneksi idle — jangan simpan koneksi idle,
	// dan daur ulang koneksi lebih cepat dari idle timeout Neon (~5 menit)
	database.SetMaxOpenConns(5)
	database.SetMaxIdleConns(0)
	database.SetConnMaxLifetime(2 * time.Minute)
	database.SetConnMaxIdleTime(90 * time.Second)

	if err := database.Ping(); err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	fmt.Println("Connected to PostgreSQL")
	return database
}

func migrate() {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(100) NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role VARCHAR(20) NOT NULL DEFAULT 'player',
			profile_image TEXT,
			onboarded BOOLEAN NOT NULL DEFAULT false
		);

		CREATE TABLE IF NOT EXISTS games (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			genre VARCHAR(30) NOT NULL,
			description TEXT
		);

		CREATE TABLE IF NOT EXISTS teams (
			id SERIAL PRIMARY KEY,
			game_id INTEGER NOT NULL REFERENCES games(id),
			name VARCHAR(100) NOT NULL,
			description TEXT
		);

		CREATE TABLE IF NOT EXISTS players (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			game_id INTEGER REFERENCES games(id),
			team_id INTEGER REFERENCES teams(id),
			nickname VARCHAR(50) NOT NULL,
			real_name VARCHAR(100),
			role VARCHAR(50),
			status VARCHAR(20) DEFAULT 'active',
			profile_image TEXT,
			rank VARCHAR(50),
			main_hero VARCHAR(100)
		);

		ALTER TABLE players ALTER COLUMN game_id DROP NOT NULL;
	`)
	if err != nil {
		log.Fatal("failed to migrate: ", err)
	}
	fmt.Println("Migration done")
}

func seed() {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM games`).Scan(&count)
	if err != nil {
		log.Fatal("failed to count games: ", err)
	}
	if count > 0 {
		return
	}

	_, err = db.Exec(`
		INSERT INTO games (name, genre, description) VALUES
			('Valorant', 'FPS', 'Tactical FPS 5v5 dari Riot Games.'),
			('Mobile Legends', 'MOBA', 'MOBA 5v5 populer di Asia Tenggara.'),
			('Honor of Kings', 'MOBA', 'MOBA 5v5 terpopuler di China.'),
			('Garena Speed Drifters', 'Racing', 'Game balap drift arcade.');
	`)
	if err != nil {
		log.Fatal("failed to seed games: ", err)
	}

	_, err = db.Exec(`
		INSERT INTO teams (game_id, name, description)
		SELECT id, 'ROTALEX ' || name, 'Team resmi ROTALEX untuk ' || name
		FROM games
		WHERE name IN ('Valorant', 'Mobile Legends', 'Honor of Kings', 'Garena Speed Drifters');
	`)
	if err != nil {
		log.Fatal("failed to seed teams: ", err)
	}

	fmt.Println("Seed data inserted")
}

func seedAdmin() {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'admin'`).Scan(&count)
	if err != nil {
		log.Fatal("failed to count admins: ", err)
	}
	if count > 0 {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("failed to hash admin password: ", err)
	}

	_, err = db.Exec(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ('admin', 'admin@rotalex.gg', $1, 'admin')
		ON CONFLICT (username) DO UPDATE SET role = 'admin'
	`, string(hash))
	if err != nil {
		log.Fatal("failed to seed admin: ", err)
	}

	fmt.Println("Admin user created (username: admin, password: admin123)")
}
