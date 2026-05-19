package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/utils"
)

// JWTMiddleware validates the Authorization Bearer Token on protected routes.
func JWTMiddleware(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "Missing Authorization header")
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid Authorization header format. Expected 'Bearer <token>'")
			}

			tokenString := parts[1]

			token, err := utils.ValidateToken(tokenString, cfg.JWTSecret)
			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid or expired authorization token")
			}

			claims, err := utils.ExtractClaims(token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token claims")
			}

			c.Set("user_id", claims.UserID)

			return next(c)
		}
	}
}
