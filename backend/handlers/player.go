package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PlayerGame struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Genre string `json:"genre"`
}

type PlayerTeam struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Player struct {
	ID           int         `json:"id"`
	Nickname     string      `json:"nickname"`
	RealName     string      `json:"real_name"`
	Role         string      `json:"role"`
	Rank         *string     `json:"rank"`
	MainHero     *string     `json:"main_hero"`
	Status       string      `json:"status"`
	ProfileImage *string     `json:"profile_image"`
	Game         *PlayerGame `json:"game"`
	Team         *PlayerTeam `json:"team"`
}

const playerSelect = `
	SELECT
		p.id,
		p.nickname,
		p.real_name,
		p.role,
		p.rank,
		p.main_hero,
		p.status,
		p.profile_image,
		g.id,
		g.name,
		g.genre,
		t.id,
		t.name
	FROM players p
	LEFT JOIN games g ON g.id = p.game_id
	LEFT JOIN teams t ON t.id = p.team_id
`

func scanPlayer(scanner sqlScanner) (Player, error) {
	var p Player
	var gameID, teamID sql.NullInt64
	var gameName, gameGenre, teamName sql.NullString

	err := scanner.Scan(
		&p.ID, &p.Nickname, &p.RealName, &p.Role, &p.Rank, &p.MainHero, &p.Status, &p.ProfileImage,
		&gameID, &gameName, &gameGenre,
		&teamID, &teamName,
	)
	if err != nil {
		return p, err
	}

	if gameID.Valid {
		p.Game = &PlayerGame{ID: int(gameID.Int64), Name: gameName.String, Genre: gameGenre.String}
	}
	if teamID.Valid {
		p.Team = &PlayerTeam{ID: int(teamID.Int64), Name: teamName.String}
	}

	return p, nil
}

type sqlScanner interface {
	Scan(dest ...any) error
}

func GetPlayers(c *gin.Context) {
	rows, err := db.Query(playerSelect + ` ORDER BY p.id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get players"})
		return
	}
	defer rows.Close()

	players := []Player{}
	for rows.Next() {
		p, err := scanPlayer(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan player"})
			return
		}
		players = append(players, p)
	}

	c.JSON(http.StatusOK, players)
}

func GetPlayer(c *gin.Context) {
	id := c.Param("id")

	p, err := getPlayerByID(parseInt(id))
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get player"})
		return
	}

	c.JSON(http.StatusOK, p)
}

type playerInput struct {
	Nickname string  `json:"nickname"`
	RealName string  `json:"real_name"`
	GameID   *int    `json:"game_id"`
	TeamID   *int    `json:"team_id"`
	Role     string  `json:"role"`
	Rank     *string `json:"rank"`
	MainHero *string `json:"main_hero"`
	Status   string  `json:"status"`
}

func CreatePlayer(c *gin.Context) {
	var in playerInput
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

	var id int
	err := db.QueryRow(`
		INSERT INTO players (nickname, real_name, game_id, team_id, role, rank, main_hero, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, in.Nickname, in.RealName, in.GameID, in.TeamID, in.Role, in.Rank, in.MainHero, in.Status).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create player"})
		return
	}

	p, err := getPlayerByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create player"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func UpdatePlayer(c *gin.Context) {
	id := c.Param("id")

	var in playerInput
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
		WHERE id = $9
	`, in.Nickname, in.RealName, in.GameID, in.TeamID, in.Role, in.Rank, in.MainHero, in.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update player"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}

	p, err := getPlayerByID(parseInt(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update player"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func DeletePlayer(c *gin.Context) {
	id := c.Param("id")

	// Cek apakah player ini milik user terdaftar
	var userID sql.NullInt64
	err := db.QueryRow(`SELECT user_id FROM players WHERE id = $1`, id).Scan(&userID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete player"})
		return
	}

	// Tidak boleh hapus player milik akun sendiri
	if userID.Valid && int(userID.Int64) == c.GetInt("user_id") {
		c.JSON(http.StatusBadRequest, gin.H{"message": "cannot delete your own player profile"})
		return
	}

	res, err := db.Exec(`DELETE FROM players WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete player"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Player not found"})
		return
	}

	// Player milik user terdaftar → hapus user-nya juga
	if userID.Valid {
		_, err = db.Exec(`DELETE FROM users WHERE id = $1`, userID.Int64)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete user"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Player deleted"})
}

func getPlayerByID(id int) (Player, error) {
	var p Player
	var gameID, teamID sql.NullInt64
	var gameName, gameGenre, teamName sql.NullString

	err := db.QueryRow(playerSelect+` WHERE p.id = $1`, id).Scan(
		&p.ID, &p.Nickname, &p.RealName, &p.Role, &p.Rank, &p.MainHero, &p.Status, &p.ProfileImage,
		&gameID, &gameName, &gameGenre,
		&teamID, &teamName,
	)
	if err != nil {
		return p, err
	}

	if gameID.Valid {
		p.Game = &PlayerGame{ID: int(gameID.Int64), Name: gameName.String, Genre: gameGenre.String}
	}
	if teamID.Valid {
		p.Team = &PlayerTeam{ID: int(teamID.Int64), Name: teamName.String}
	}

	return p, nil
}
