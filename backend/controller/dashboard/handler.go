package dashboard

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// DashboardController handles HTTP API calls for usage tracking metrics.
type DashboardController struct {
	dashboardService DashboardService
}

// NewDashboardController instantiates a new Echo metrics controller.
func NewDashboardController(dashboardService DashboardService) *DashboardController {
	return &DashboardController{
		dashboardService: dashboardService,
	}
}

// GetSummary retrieves aggregates of all completed chat prompt tokens and provider usage metrics.
func (ctrl *DashboardController) GetSummary(c echo.Context) error {
	userID := c.Get("user_id").(string)

	summary, err := ctrl.dashboardService.GetSummary(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to aggregate usage metrics: "+err.Error())
	}

	return c.JSON(http.StatusOK, summary)
}
