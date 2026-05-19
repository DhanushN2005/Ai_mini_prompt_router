package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Config holds all the environmental variables required by our application.
type Config struct {
	Port            string
	MongoURI        string
	MongoDBName     string
	JWTSecret       string
	Env             string
	OpenAIApiKey    string
	AnthropicApiKey string
	GeminiApiKey    string
	GroqApiKey      string
}

// DB holds the package-level shared singleton database instance.
var DB *mongo.Database

// LoadConfig loads variables from a .env file and environment, returning a populated Config struct.
func LoadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from OS environment variables instead.")
	}

	port := getEnv("PORT", "8080")
	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017")
	mongoDBName := getEnv("MONGO_DB", "mini_prompt_router")
	jwtSecret := getEnv("JWT_SECRET", "")
	env := getEnv("ENV", "development")

	openaiKey := getEnv("OPENAI_API_KEY", "")
	anthropicKey := getEnv("ANTHROPIC_API_KEY", "")
	geminiKey := getEnv("GEMINI_API_KEY", "")
	groqKey := getEnv("GROQ_API_KEY", "")

	if jwtSecret == "" {
		log.Println("WARNING: JWT_SECRET is empty. Auth services will fail.")
	}

	return &Config{
		Port:            port,
		MongoURI:        mongoURI,
		MongoDBName:     mongoDBName,
		JWTSecret:       jwtSecret,
		Env:             env,
		OpenAIApiKey:    openaiKey,
		AnthropicApiKey: anthropicKey,
		GeminiApiKey:    geminiKey,
		GroqApiKey:      groqKey,
	}, nil
}

// ConnectDB initializes a thread-safe connection to MongoDB and pings the server to ensure connectivity.
func ConnectDB(cfg *Config) (*mongo.Client, error) {
	log.Println("Connecting to MongoDB...")

	// 1. Attempt connection to the primary configured URI (e.g. Cloud Atlas)
	primaryCtx, primaryCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer primaryCancel()

	log.Printf("Connecting to primary database: %s", cfg.MongoURI)
	clientOptions := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(primaryCtx, clientOptions)
	if err == nil {
		err = client.Ping(primaryCtx, nil)
		if err == nil {
			log.Println("Successfully connected to primary MongoDB cloud cluster!")
			DB = client.Database(cfg.MongoDBName)
			return client, nil
		}
	}

	// 2. Dynamic Fallback to Local Sandbox if the cloud database fails or times out
	log.Printf("Primary MongoDB connection unavailable: %v. Gracefully falling back to local sandbox...", err)

	localCtx, localCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer localCancel()

	localURI := "mongodb://localhost:27017"
	localOptions := options.Client().ApplyURI(localURI)
	localClient, localErr := mongo.Connect(localCtx, localOptions)
	if localErr != nil {
		return nil, fmt.Errorf("both cloud and local sandbox database connections failed: %w", localErr)
	}

	localErr = localClient.Ping(localCtx, nil)
	if localErr != nil {
		return nil, fmt.Errorf("both cloud and local sandbox database connections failed (local ping error): %w", localErr)
	}

	log.Println("Successfully connected to local fallback MongoDB!")
	DB = localClient.Database(cfg.MongoDBName)
	return localClient, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
