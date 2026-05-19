package utils

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator wraps the official go-playground/validator.
// We implement Echo's Custom Validator interface so we can use c.Validate().
type CustomValidator struct {
	Validator *validator.Validate
}

// NewCustomValidator is a constructor to instantiate our validator.
func NewCustomValidator() *CustomValidator {
	return &CustomValidator{
		Validator: validator.New(),
	}
}

// Validate executes struct tag validations on the passed interface.
// If any validation rules fail, it returns an Echo HTTP error (400 Bad Request) containing the specific errors.
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.Validator.Struct(i); err != nil {
		// Cast the error to validator.ValidationErrors to inspect individual fields.
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}
