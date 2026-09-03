package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
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

	_, err = db.Exec(`DROP TABLE IF EXISTS players, teams, games, users CASCADE`)
	if err != nil {
		log.Fatal("failed to drop tables: ", err)
	}
	fmt.Println("Old tables dropped")

	_, err = db.Exec(`
		CREATE TABLE users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(100) NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role VARCHAR(20) NOT NULL DEFAULT 'player'
		);

		CREATE TABLE games (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			genre VARCHAR(30) NOT NULL,
			description TEXT
		);

		CREATE TABLE teams (
			id SERIAL PRIMARY KEY,
			game_id INTEGER NOT NULL REFERENCES games(id),
			name VARCHAR(100) NOT NULL,
			description TEXT
		);

		CREATE TABLE players (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			game_id INTEGER NOT NULL REFERENCES games(id),
			team_id INTEGER REFERENCES teams(id),
			nickname VARCHAR(50) NOT NULL,
			real_name VARCHAR(100),
			role VARCHAR(50),
			status VARCHAR(20) DEFAULT 'active'
		);
	`)
	if err != nil {
		log.Fatal("failed to create tables: ", err)
	}
	fmt.Println("New tables created")

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
	fmt.Println("Games seeded")

	_, err = db.Exec(`
		INSERT INTO teams (game_id, name, description)
		SELECT id, 'ROTALEX ' || name, 'Team resmi ROTALEX untuk ' || name
		FROM games
		WHERE name IN ('Valorant', 'Mobile Legends', 'Honor of Kings', 'Garena Speed Drifters');
	`)
	if err != nil {
		log.Fatal("failed to seed teams: ", err)
	}
	fmt.Println("Teams seeded")
	fmt.Println("Reset complete")
}
