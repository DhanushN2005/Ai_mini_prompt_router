package bots

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/mongo"
)

// BotController handles incoming HTTP traffic for all bot operations.
type BotController struct {
	botService BotService
}

// NewBotController constructs a new BotController.
func NewBotController(botService BotService) *BotController {
	return &BotController{
		botService: botService,
	}
}

// Create handles HTTP POST /api/bots
func (ctrl *BotController) Create(c echo.Context) error {
	req := new(BotCreateRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body format")
	}

	if err := c.Validate(req); err != nil {
		return err
	}

	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	ctx := c.Request().Context()
	bot, err := ctrl.botService.CreateBot(ctx, userID, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, bot)
}

// GetByID handles HTTP GET /api/bots/:id
func (ctrl *BotController) GetByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing Bot ID parameter")
	}

	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	ctx := c.Request().Context()
	bot, err := ctrl.botService.GetBotByID(ctx, id, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments || err.Error() == "invalid bot ID format" {
			return echo.NewHTTPError(http.StatusNotFound, "Bot not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, bot)
}

// GetAll handles HTTP GET /api/bots
func (ctrl *BotController) GetAll(c echo.Context) error {
	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	ctx := c.Request().Context()
	bots, err := ctrl.botService.GetAllBots(ctx, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, bots)
}

// Update handles HTTP PATCH /api/bots/:id
func (ctrl *BotController) Update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing Bot ID parameter")
	}

	req := new(BotUpdateRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body format")
	}

	if err := c.Validate(req); err != nil {
		return err
	}

	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	ctx := c.Request().Context()
	bot, err := ctrl.botService.UpdateBot(ctx, id, userID, req)
	if err != nil {
		if err == mongo.ErrNoDocuments || err.Error() == "invalid bot ID format" {
			return echo.NewHTTPError(http.StatusNotFound, "Bot not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, bot)
}

// Delete handles HTTP DELETE /api/bots/:id
func (ctrl *BotController) Delete(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing Bot ID parameter")
	}

	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	ctx := c.Request().Context()
	err := ctrl.botService.DeleteBot(ctx, id, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments || err.Error() == "invalid bot ID format" {
			return echo.NewHTTPError(http.StatusNotFound, "Bot not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Bot successfully deleted",
	})
}

// GetLiveModels handles HTTP GET /api/bots/models
func (ctrl *BotController) GetLiveModels(c echo.Context) error {
	ctx := c.Request().Context()
	modelsList, err := ctrl.botService.GetAvailableModels(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, modelsList)
}
