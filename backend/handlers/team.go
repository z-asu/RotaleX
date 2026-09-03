package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Team struct {
	ID          int    `json:"id"`
	GameID      int    `json:"game_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	GameName    string `json:"game_name"`
	Genre       string `json:"genre"`
}

func GetTeams(c *gin.Context) {
	rows, err := db.Query(`
		SELECT
			t.id,
			t.game_id,
			t.name,
			t.description,
			g.name AS game_name,
			g.genre
		FROM teams t
		JOIN games g ON g.id = t.game_id
		ORDER BY t.id
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get teams"})
		return
	}
	defer rows.Close()

	teams := []Team{}
	for rows.Next() {
		var t Team
		if err := rows.Scan(&t.ID, &t.GameID, &t.Name, &t.Description, &t.GameName, &t.Genre); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan team"})
			return
		}
		teams = append(teams, t)
	}

	c.JSON(http.StatusOK, teams)
}

func GetTeam(c *gin.Context) {
	id := c.Param("id")

	var t Team
	err := db.QueryRow(`
		SELECT
			t.id,
			t.game_id,
			t.name,
			t.description,
			g.name AS game_name,
			g.genre
		FROM teams t
		JOIN games g ON g.id = t.game_id
		WHERE t.id = $1
	`, id).Scan(&t.ID, &t.GameID, &t.Name, &t.Description, &t.GameName, &t.Genre)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Team not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get team"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func CreateTeam(c *gin.Context) {
	var t Team
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if t.Name == "" || t.GameID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name and game_id are required"})
		return
	}

	err := db.QueryRow(`
		INSERT INTO teams (game_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id
	`, t.GameID, t.Name, t.Description).Scan(&t.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create team"})
		return
	}

	c.JSON(http.StatusCreated, t)
}

func UpdateTeam(c *gin.Context) {
	id := c.Param("id")

	var t Team
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if t.Name == "" || t.GameID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "name and game_id are required"})
		return
	}

	err := db.QueryRow(`
		UPDATE teams
		SET game_id = $1, name = $2, description = $3
		WHERE id = $4
		RETURNING id
	`, t.GameID, t.Name, t.Description, id).Scan(&t.ID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Team not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update team"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func DeleteTeam(c *gin.Context) {
	id := c.Param("id")

	res, err := db.Exec(`DELETE FROM teams WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete team"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Team not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team deleted"})
}
