package auth

import (
	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/middleware"
)

// RegisterRoutes registers auth endpoints into the standard Echo API router group.
func RegisterRoutes(g *echo.Group, ctrl *AuthController, cfg *config.Config) {
	g.POST("/auth/signup", ctrl.Signup)
	g.POST("/auth/login", ctrl.Login)

	protected := g.Group("/auth")
	protected.Use(middleware.JWTMiddleware(cfg))
	protected.GET("/me", ctrl.Me)
}
