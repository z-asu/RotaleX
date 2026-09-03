package handlers

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const uploadDir = "uploads"

func init() {
	os.MkdirAll(uploadDir, 0755)
}

var allowedImageTypes = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

func UploadProfileImage(c *gin.Context) {
	userID := c.GetInt("user_id")

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "image file is required"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedImageTypes[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"message": "only jpg, jpeg, png, webp, gif are allowed"})
		return
	}

	if header.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "image must be under 2MB"})
		return
	}

	filename := fmt.Sprintf("user_%d_%d%s", userID, rand.Intn(1000000), ext)
	dst := filepath.Join(uploadDir, filename)

	out, err := os.Create(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to save image"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to save image"})
		return
	}

	imageURL := "/uploads/" + filename

	_, err = db.Exec(`UPDATE users SET profile_image = $1 WHERE id = $2`, imageURL, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update profile image"})
		return
	}

	_, err = db.Exec(`UPDATE players SET profile_image = $1 WHERE user_id = $2`, imageURL, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to update player image"})
		return
	}

	var user User
	err = db.QueryRow(`
		SELECT id, username, email, role, profile_image, onboarded
		FROM users
		WHERE id = $1
	`, userID).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.ProfileImage, &user.Onboarded)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get user"})
		return
	}

	c.JSON(http.StatusOK, user)
}
