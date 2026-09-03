package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetDashboard(c *gin.Context) {
	var games, teams, players int

	if err := db.QueryRow(`SELECT COUNT(*) FROM games`).Scan(&games); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to count games"})
		return
	}
	if err := db.QueryRow(`SELECT COUNT(*) FROM teams`).Scan(&teams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to count teams"})
		return
	}
	if err := db.QueryRow(`SELECT COUNT(*) FROM players`).Scan(&players); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to count players"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"games":   games,
		"teams":   teams,
		"players": players,
	})
}
