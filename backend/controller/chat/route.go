package chat

import (
	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/middleware"
)

// RegisterRoutes registers chat endpoints in Echo.
func RegisterRoutes(g *echo.Group, ctrl *ChatController, cfg *config.Config) {
	protected := g.Group("/chat")
	protected.Use(middleware.JWTMiddleware(cfg))

	protected.POST("", ctrl.SendPrompt)
}
