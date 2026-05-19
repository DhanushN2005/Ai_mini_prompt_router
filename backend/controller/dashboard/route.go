package dashboard

import (
	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/middleware"
)

// RegisterRoutes registers dashboard endpoints in Echo.
func RegisterRoutes(g *echo.Group, ctrl *DashboardController, cfg *config.Config) {
	// Support both /usage/summary (old) and /dashboard/stats (new/blueprinted) to ensure seamless compatibility
	protectedUsage := g.Group("/usage")
	protectedUsage.Use(middleware.JWTMiddleware(cfg))
	protectedUsage.GET("/summary", ctrl.GetSummary)

	protectedDashboard := g.Group("/dashboard")
	protectedDashboard.Use(middleware.JWTMiddleware(cfg))
	protectedDashboard.GET("/stats", ctrl.GetSummary)
}
