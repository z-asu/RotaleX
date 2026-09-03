package main

import (
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"database/sql"
)

func main() {
	url := os.Getenv("DATABASE_URL")
	database, err := sql.Open("pgx", url)
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	rows, err := database.Query(`
		SELECT table_name, column_name, data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		ORDER BY table_name, ordinal_position
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var table, column, dataType string
		if err := rows.Scan(&table, &column, &dataType); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("%s.%s (%s)\n", table, column, dataType)
	}
}
