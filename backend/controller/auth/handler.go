package auth

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// AuthController defines the HTTP entry handlers for signup and login endpoints.
type AuthController struct {
	authService AuthService
}

// NewAuthController constructs a new AuthController injecting the needed services.
func NewAuthController(authService AuthService) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

// Signup handles incoming HTTP POST /api/auth/signup requests.
func (ctrl *AuthController) Signup(c echo.Context) error {
	req := new(SignupRequest)

	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body format")
	}

	if err := c.Validate(req); err != nil {
		return err
	}

	ctx := c.Request().Context()
	resp, err := ctrl.authService.Signup(ctx, req)
	if err != nil {
		if err.Error() == "email is already registered" {
			return echo.NewHTTPError(http.StatusConflict, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, resp)
}

// Login handles incoming HTTP POST /api/auth/login requests.
func (ctrl *AuthController) Login(c echo.Context) error {
	req := new(LoginRequest)

	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body format")
	}

	if err := c.Validate(req); err != nil {
		return err
	}

	ctx := c.Request().Context()
	resp, err := ctrl.authService.Login(ctx, req)
	if err != nil {
		if err.Error() == "invalid email or password" {
			return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, resp)
}

// Me handles incoming HTTP GET /api/auth/me requests for the authenticated user.
func (ctrl *AuthController) Me(c echo.Context) error {
	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User session credentials not found in context")
	}

	ctx := c.Request().Context()
	user, err := ctrl.authService.GetProfile(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User profile not found")
	}

	return c.JSON(http.StatusOK, user)
}
