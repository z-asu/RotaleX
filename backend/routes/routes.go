package routes

import (
	"net/http"

	"rotalex/backend/handlers"
	"rotalex/backend/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	api := r.Group("/api")

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Auth (public)
	api.POST("/register", handlers.Register)
	api.POST("/login", handlers.Login)

	// Auth (logged in)
	auth := api.Group("", middleware.AuthRequired())
	auth.GET("/me", handlers.Me)
	auth.PUT("/me", handlers.UpdateMe)
	auth.PUT("/me/password", handlers.ChangePassword)
	auth.POST("/me/image", handlers.UploadProfileImage)
	auth.POST("/me/onboarding", handlers.CompleteOnboarding)
	auth.GET("/me/player", handlers.GetMyPlayer)
	auth.PUT("/me/player", handlers.UpdateMyPlayer)

	// Admin
	admin := api.Group("", middleware.AuthRequired(), middleware.AdminRequired())

	// Dashboard (public)
	api.GET("/dashboard", handlers.GetDashboard)

	// Games (read public, write admin)
	api.GET("/games", handlers.GetGames)
	api.GET("/games/:id", handlers.GetGame)
	admin.POST("/games", handlers.CreateGame)
	admin.PUT("/games/:id", handlers.UpdateGame)
	admin.DELETE("/games/:id", handlers.DeleteGame)

	// Teams (read public, write admin)
	api.GET("/teams", handlers.GetTeams)
	api.GET("/teams/:id", handlers.GetTeam)
	admin.POST("/teams", handlers.CreateTeam)
	admin.PUT("/teams/:id", handlers.UpdateTeam)
	admin.DELETE("/teams/:id", handlers.DeleteTeam)

	// Players (read public, write admin)
	api.GET("/players", handlers.GetPlayers)
	api.GET("/players/:id", handlers.GetPlayer)
	admin.POST("/players", handlers.CreatePlayer)
	admin.PUT("/players/:id", handlers.UpdatePlayer)
	admin.DELETE("/players/:id", handlers.DeletePlayer)

	// Users management (admin only)
	admin.GET("/users", handlers.GetUsers)
	admin.PUT("/users/:id/role", handlers.UpdateUserRole)
	admin.DELETE("/users/:id", handlers.DeleteUser)
}
