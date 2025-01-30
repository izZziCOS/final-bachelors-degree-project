package router

import (
	"siltnamis/controller"
	"siltnamis/middlewares"

	"github.com/gin-gonic/gin"
)

// SetupRouter setups routing
func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Middlewares
	router.Use(middlewares.ErrorHandler)
	router.Use(middlewares.CORSMiddleware())

	// routes
	router.GET("/ping", controller.Pong)
	router.POST("/register", controller.Create)
	router.POST("/login", controller.Login)
	router.GET("/session", controller.Session)
	router.POST("/createReset", controller.InitiatePasswordReset)
	router.POST("/resetPassword", controller.ResetPassword)
	router.GET("/settings", controller.GetSettings)
	router.PUT("/settings", controller.UpdateSettings)
	router.GET("/history", controller.GetHistory)
	router.GET("/houseplants", controller.GetHouseplants)
	router.GET("/ws", controller.WsHandler)
	return router
}
