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

	_, err = db.Exec(`
		ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
		ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_image TEXT;
	`)
	if err != nil {
		log.Fatal("failed to add profile_image columns: ", err)
	}
	fmt.Println("Kolom profile_image ditambahkan (users & players)")

	// Copy profile image yang mungkin sudah ada? Tidak ada, skip
	_, err = db.Exec(`
		UPDATE players p
		SET profile_image = u.profile_image
		FROM users u
		WHERE p.user_id = u.id AND p.profile_image IS NULL
	`)
	if err != nil {
		log.Fatal("failed to sync profile images: ", err)
	}
	fmt.Println("Sinkronisasi profile_image players <- users selesai")
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
