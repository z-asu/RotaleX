package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	loadEnv()

	url := os.Getenv("DATABASE_URL")
	if url == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	db, err := sql.Open("pgx", url)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	// players.game_id boleh NULL (player tanpa game)
	_, err = db.Exec(`ALTER TABLE players ALTER COLUMN game_id DROP NOT NULL`)
	if err != nil {
		log.Fatal("failed to alter players.game_id: ", err)
	}
	fmt.Println("players.game_id sekarang nullable")

	// Setiap user dapat baris player (kalau belum ada)
	res, err := db.Exec(`
		INSERT INTO players (user_id, game_id, team_id, nickname, real_name, role, status)
		SELECT u.id, NULL, NULL, u.username, u.username, u.role, 'active'
		FROM users u
		WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.user_id = u.id)
	`)
	if err != nil {
		log.Fatal("failed to sync players: ", err)
	}
	n, _ := res.RowsAffected()
	fmt.Printf("Sync selesai: %d player dibuat dari user\n", n)
}

func loadEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		return
	}
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
