package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int     `json:"id"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	Role         string  `json:"role"`
	ProfileImage *string `json:"profile_image"`
	Onboarded    bool    `json:"onboarded"`
}

type registerInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func checkPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func generateToken(user User) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func Register(c *gin.Context) {
	var in registerInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.TrimSpace(strings.ToLower(in.Email))
	if in.Username == "" || in.Email == "" || len(in.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "username, email, and password (min 6 chars) are required"})
		return
	}

	hash, err := hashPassword(in.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to hash password"})
		return
	}

	var id int
	err = db.QueryRow(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, 'player')
		RETURNING id
	`, in.Username, in.Email, hash).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusBadRequest, gin.H{"message": "username or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create user"})
		return
	}

	user := User{ID: id, Username: in.Username, Email: in.Email, Role: "player", Onboarded: false}

	_, err = db.Exec(`
		INSERT INTO players (user_id, game_id, team_id, nickname, real_name, role, status)
		VALUES ($1, NULL, NULL, $2, $2, $3, 'active')
	`, id, in.Username, "player")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create player profile"})
		return
	}

	token, err := generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": user, "token": token})
}

func Login(c *gin.Context) {
	var in loginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	var user User
	var hash string
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, role, profile_image, onboarded
		FROM users
		WHERE username = $1
	`, strings.TrimSpace(in.Username)).Scan(&user.ID, &user.Username, &user.Email, &hash, &user.Role, &user.ProfileImage, &user.Onboarded)
	if err != nil || !checkPassword(hash, in.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid username or password"})
		return
	}

	token, err := generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "token": token})
}

func Me(c *gin.Context) {
	userID := c.GetInt("user_id")

	var user User
	err := db.QueryRow(`
		SELECT id, username, email, role, profile_image, onboarded
		FROM users
		WHERE id = $1
	`, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.ProfileImage, &user.Onboarded)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func UpdateMe(c *gin.Context) {
	userID := c.GetInt("user_id")

	var in struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.TrimSpace(strings.ToLower(in.Email))
	if in.Username == "" || in.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "username and email are required"})
		return
	}

	var user User
	err := db.QueryRow(`
		UPDATE users
		SET username = $1, email = $2
		WHERE id = $3
		RETURNING id, username, email, role, profile_image, onboarded
	`, in.Username, in.Email, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.ProfileImage, &user.Onboarded)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusBadRequest, gin.H{"message": "username or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update profile"})
		return
	}

	_, err = db.Exec(`
		UPDATE players SET nickname = $1 WHERE user_id = $2
	`, in.Username, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update player"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func ChangePassword(c *gin.Context) {
	userID := c.GetInt("user_id")

	var in struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || len(in.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "password (min 6 chars) is required"})
		return
	}

	hash, err := hashPassword(in.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to hash password"})
		return
	}

	res, err := db.Exec(`UPDATE users SET password_hash = $1 WHERE id = $2`, hash, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update password"})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}
