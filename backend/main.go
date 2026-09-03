package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"rotalex/backend/handlers"
	"rotalex/backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	db = connectDB()
	defer db.Close()

	handlers.SetDB(db)

	migrate()
	seed()
	seedAdmin()

	r := gin.Default()
	routes.Setup(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if strings.HasPrefix(port, ":") == false {
		port = ":" + port
	}

	fmt.Println("Backend running on port", port)
	log.Fatal(r.Run(port))
}
