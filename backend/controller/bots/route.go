package bots

import (
	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/middleware"
)

// RegisterRoutes registers all CRUD endpoints for bot management.
func RegisterRoutes(g *echo.Group, ctrl *BotController, cfg *config.Config) {
	protected := g.Group("/bots")
	protected.Use(middleware.JWTMiddleware(cfg))

	protected.POST("", ctrl.Create)
	protected.GET("", ctrl.GetAll)
	protected.GET("/models", ctrl.GetLiveModels)
	protected.GET("/:id", ctrl.GetByID)
	protected.PATCH("/:id", ctrl.Update)
	protected.DELETE("/:id", ctrl.Delete)
}
