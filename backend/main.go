package main

import (
	"fmt"
	"log"

	"rotalex/backend/handlers"
	"rotalex/backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	db = connectDB()
	defer db.Close()

	handlers.SetDB(db)

	migrate()
	seed()
	seedAdmin()

	r := gin.Default()
	routes.Setup(r)

	fmt.Println("Backend running on http://localhost:8080")
	log.Fatal(r.Run(":8080"))
}
