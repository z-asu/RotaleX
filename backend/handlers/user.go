package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func parseInt(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}

type AdminUser struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	Role         string  `json:"role"`
	ProfileImage *string `json:"profile_image"`
}

func GetUsers(c *gin.Context) {
	rows, err := db.Query(`
		SELECT id, username, email, role, profile_image
		FROM users
		ORDER BY id
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get users"})
		return
	}
	defer rows.Close()

	users := []AdminUser{}
	for rows.Next() {
		var u AdminUser
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.ProfileImage); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan user"})
			return
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var in struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	if in.Role != "admin" && in.Role != "player" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "role must be admin or player"})
		return
	}

	var u AdminUser
	err := db.QueryRow(`
		UPDATE users
		SET role = $1
		WHERE id = $2
		RETURNING id, username, email, role, profile_image
	`, in.Role, id).Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.ProfileImage)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update role"})
		return
	}

	_, err = db.Exec(`UPDATE players SET role = $1 WHERE user_id = $2`, in.Role, u.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to sync player role"})
		return
	}

	c.JSON(http.StatusOK, u)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if c.GetInt("user_id") == parseInt(id) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "cannot delete your own account"})
		return
	}

	_, err := db.Exec(`DELETE FROM players WHERE user_id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete player"})
		return
	}

	res, err := db.Exec(`DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete user"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}
