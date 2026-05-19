package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	eMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/controller/auth"
	"github.com/username/mini-prompt-router/controller/bots"
	"github.com/username/mini-prompt-router/controller/chat"
	"github.com/username/mini-prompt-router/controller/dashboard"
	"github.com/username/mini-prompt-router/llm"
	"github.com/username/mini-prompt-router/utils"
)

func main() {
	log.Println("Starting Mini Prompt Router Backend in New Modular Layout...")

	// 1. Load Configurations
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Critical Error loading config: %v", err)
	}

	// 2. Establish MongoDB Database Connection
	mongoClient, err := config.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Critical Error connecting to Database: %v", err)
	}

	// 3. Initialize the Echo framework instance
	e := echo.New()

	// 4. Register custom validator for request struct validations
	e.Validator = utils.NewCustomValidator()

	// 5. Register global standard middlewares
	e.Use(eMiddleware.Logger())
	e.Use(eMiddleware.Recover())
	e.Use(eMiddleware.CORSWithConfig(eMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
	}))

	// 6. Setup Modular Routes
	api := e.Group("/api")

	authCtrl := auth.NewAuthController(auth.NewAuthService(cfg))
	auth.RegisterRoutes(api, authCtrl, cfg)

	botCtrl := bots.NewBotController(bots.NewBotService())
	bots.RegisterRoutes(api, botCtrl, cfg)

	llmRouter := llm.NewLLMRouter(cfg)
	chatCtrl := chat.NewChatController(chat.NewChatService(llmRouter))
	chat.RegisterRoutes(api, chatCtrl, cfg)

	dashboardCtrl := dashboard.NewDashboardController(dashboard.NewDashboardService())
	dashboard.RegisterRoutes(api, dashboardCtrl, cfg)

	// 7. Safe Graceful Shutdown Implementation
	go func() {
		serverAddr := ":" + cfg.Port
		log.Printf("Server listening on port %s", cfg.Port)
		if err := e.Start(serverAddr); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Shutting down the server due to error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := mongoClient.Disconnect(ctx); err != nil {
		log.Printf("Error disconnecting MongoDB: %v", err)
	}

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited successfully!")
}
