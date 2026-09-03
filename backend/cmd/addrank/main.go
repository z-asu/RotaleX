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
		ALTER TABLE players ADD COLUMN IF NOT EXISTS rank VARCHAR(50);
		ALTER TABLE players ADD COLUMN IF NOT EXISTS main_hero VARCHAR(100);
	`)
	if err != nil {
		log.Fatal("failed to add columns: ", err)
	}
	fmt.Println("Kolom players.rank & players.main_hero ditambahkan")
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
