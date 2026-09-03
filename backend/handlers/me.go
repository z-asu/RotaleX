package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type onboardingInput struct {
	Nickname string  `json:"nickname"`
	RealName string  `json:"real_name"`
	GameID   *int    `json:"game_id"`
	TeamID   *int    `json:"team_id"`
	Role     string  `json:"role"`
	Rank     *string `json:"rank"`
	MainHero *string `json:"main_hero"`
}

type myPlayerInput struct {
	Nickname string  `json:"nickname"`
	RealName string  `json:"real_name"`
	GameID   *int    `json:"game_id"`
	TeamID   *int    `json:"team_id"`
	Role     string  `json:"role"`
	Rank     *string `json:"rank"`
	MainHero *string `json:"main_hero"`
	Status   string  `json:"status"`
}

// Onboarding: isi perkenalan member baru, tandai onboarded=true
func CompleteOnboarding(c *gin.Context) {
	userID := c.GetInt("user_id")

	var in onboardingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if in.Nickname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "nickname is required"})
		return
	}

	var playerID int
	err := db.QueryRow(`
		UPDATE players
		SET nickname = $1, real_name = $2, game_id = $3, team_id = $4, role = $5, rank = $6, main_hero = $7
		WHERE user_id = $8
		RETURNING id
	`, in.Nickname, in.RealName, in.GameID, in.TeamID, in.Role, in.Rank, in.MainHero, userID).Scan(&playerID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to save onboarding"})
		return
	}

	var user User
	err = db.QueryRow(`
		UPDATE users SET onboarded = true
		WHERE id = $1
		RETURNING id, username, email, role, profile_image, onboarded
	`, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.ProfileImage, &user.Onboarded)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update user"})
		return
	}

	player, err := getPlayerByID(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "player": player})
}

// MyPlayer: data player milik user yang login
func GetMyPlayer(c *gin.Context) {
	userID := c.GetInt("user_id")

	var playerID int
	err := db.QueryRow(`
		SELECT id FROM players WHERE user_id = $1
	`, userID).Scan(&playerID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	player, err := getPlayerByID(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	c.JSON(http.StatusOK, player)
}

// UpdateMyPlayer: user edit data player-nya sendiri
func UpdateMyPlayer(c *gin.Context) {
	userID := c.GetInt("user_id")

	var in myPlayerInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if in.Nickname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "nickname is required"})
		return
	}
	if in.Status == "" {
		in.Status = "active"
	}

	res, err := db.Exec(`
		UPDATE players
		SET nickname = $1, real_name = $2, game_id = $3, team_id = $4, role = $5, rank = $6, main_hero = $7, status = $8
		WHERE user_id = $9
	`, in.Nickname, in.RealName, in.GameID, in.TeamID, in.Role, in.Rank, in.MainHero, in.Status, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update player"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}

	var playerID int
	err = db.QueryRow(`SELECT id FROM players WHERE user_id = $1`, userID).Scan(&playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	player, err := getPlayerByID(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	c.JSON(http.StatusOK, player)
}
