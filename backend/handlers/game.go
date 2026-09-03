package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Game struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Genre       string `json:"genre"`
	Description string `json:"description"`
}

func GetGames(c *gin.Context) {
	rows, err := db.Query(`
		SELECT id, name, genre, description
		FROM games
		ORDER BY id
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get games"})
		return
	}
	defer rows.Close()

	games := []Game{}
	for rows.Next() {
		var g Game
		if err := rows.Scan(&g.ID, &g.Name, &g.Genre, &g.Description); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan game"})
			return
		}
		games = append(games, g)
	}

	c.JSON(http.StatusOK, games)
}

func GetGame(c *gin.Context) {
	id := c.Param("id")

	var g Game
	err := db.QueryRow(`
		SELECT id, name, genre, description
		FROM games
		WHERE id = $1
	`, id).Scan(&g.ID, &g.Name, &g.Genre, &g.Description)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Game not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get game"})
		return
	}

	c.JSON(http.StatusOK, g)
}

func CreateGame(c *gin.Context) {
	var g Game
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if g.Name == "" || g.Genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name and genre are required"})
		return
	}

	err := db.QueryRow(`
		INSERT INTO games (name, genre, description)
		VALUES ($1, $2, $3)
		RETURNING id
	`, g.Name, g.Genre, g.Description).Scan(&g.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create game"})
		return
	}

	c.JSON(http.StatusCreated, g)
}

func UpdateGame(c *gin.Context) {
	id := c.Param("id")

	var g Game
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if g.Name == "" || g.Genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name and genre are required"})
		return
	}

	err := db.QueryRow(`
		UPDATE games
		SET name = $1, genre = $2, description = $3
		WHERE id = $4
		RETURNING id
	`, g.Name, g.Genre, g.Description, id).Scan(&g.ID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Game not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update game"})
		return
	}

	c.JSON(http.StatusOK, g)
}

func DeleteGame(c *gin.Context) {
	id := c.Param("id")

	res, err := db.Exec(`DELETE FROM games WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete game"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Game not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Game deleted"})
}
