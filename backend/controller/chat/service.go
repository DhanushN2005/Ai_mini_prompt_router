package chat

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/controller/bots"
	"github.com/username/mini-prompt-router/llm"
)

// ChatService defines the business logic operations for running chat completions.
type ChatService interface {
	ProcessChat(ctx context.Context, userID string, req *ChatRequest) (*llm.ChatResponse, error)
	ProcessChatStream(ctx context.Context, userID string, req *ChatRequest, chunkChan chan<- string) (*llm.ChatResponse, error)
}

type chatService struct {
	botsCollection  *mongo.Collection
	usageCollection *mongo.Collection
	llmRouter       llm.LLMRouter
}

// NewChatService instantiates our Chat Service.
func NewChatService(llmRouter llm.LLMRouter) ChatService {
	return &chatService{
		botsCollection:  config.DB.Collection("bots"),
		usageCollection: config.DB.Collection("usage_logs"),
		llmRouter:       llmRouter,
	}
}

func (s *chatService) ProcessChat(ctx context.Context, userID string, req *ChatRequest) (*llm.ChatResponse, error) {
	log.Printf("[ChatService] Processing chat request for Bot %s by User %s", req.BotID, userID)

	bot, err := s.fetchBot(ctx, req.BotID, userID)
	if err != nil {
		return nil, err
	}

	providerClient, err := s.llmRouter.Route(bot.Provider)
	if err != nil {
		return nil, fmt.Errorf("routing failed: %w", err)
	}

	opts := &llm.GeneratorOptions{
		Temperature:      bot.Temperature,
		MaxTokens:        bot.MaxTokens,
		TopP:             bot.TopP,
		TopK:             bot.TopK,
		PresencePenalty:  bot.PresencePenalty,
		FrequencyPenalty: bot.FrequencyPenalty,
	}

	resp, err := providerClient.GenerateCompletion(ctx, bot.Model, bot.SystemPrompt, req.Prompt, opts)
	if err != nil {
		return nil, fmt.Errorf("AI completion generation failed: %w", err)
	}

	s.logUsageAsync(ctx, userID, req.BotID, bot.Name, bot.Provider, bot.Model, resp.TokensUsed)

	return resp, nil
}

func (s *chatService) ProcessChatStream(ctx context.Context, userID string, req *ChatRequest, chunkChan chan<- string) (*llm.ChatResponse, error) {
	log.Printf("[ChatService] Processing chat stream request for Bot %s by User %s", req.BotID, userID)

	bot, err := s.fetchBot(ctx, req.BotID, userID)
	if err != nil {
		return nil, err
	}

	providerClient, err := s.llmRouter.Route(bot.Provider)
	if err != nil {
		return nil, fmt.Errorf("routing failed: %w", err)
	}

	opts := &llm.GeneratorOptions{
		Temperature:      bot.Temperature,
		MaxTokens:        bot.MaxTokens,
		TopP:             bot.TopP,
		TopK:             bot.TopK,
		PresencePenalty:  bot.PresencePenalty,
		FrequencyPenalty: bot.FrequencyPenalty,
	}

	resp, err := providerClient.GenerateCompletionStream(ctx, bot.Model, bot.SystemPrompt, req.Prompt, chunkChan, opts)
	if err != nil {
		return nil, fmt.Errorf("AI completion generation failed: %w", err)
	}

	s.logUsageAsync(ctx, userID, req.BotID, bot.Name, bot.Provider, bot.Model, resp.TokensUsed)

	return resp, nil
}

func (s *chatService) fetchBot(ctx context.Context, botID string, userID string) (*bots.Bot, error) {
	botObjID, err := primitive.ObjectIDFromHex(botID)
	if err != nil {
		return nil, errors.New("invalid bot ID format")
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	filter := bson.M{
		"_id":     botObjID,
		"user_id": userObjID,
	}

	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var bot bots.Bot
	err = s.botsCollection.FindOne(dbCtx, filter).Decode(&bot)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, fmt.Errorf("bot not found or access denied")
		}
		return nil, fmt.Errorf("failed to fetch bot configurations: %w", err)
	}

	return &bot, nil
}

func (s *chatService) logUsageAsync(ctx context.Context, userID string, botID string, botName string, provider string, model string, tokensUsed int) {
	uid, _ := primitive.ObjectIDFromHex(userID)
	bid, _ := primitive.ObjectIDFromHex(botID)
	
	usageEntry := &UsageLog{
		ID:         primitive.NewObjectID(),
		UserID:     uid,
		BotID:      bid,
		BotName:    botName,
		Provider:   provider,
		Model:      model,
		TokensUsed: tokensUsed,
		CreatedAt:  time.Now(),
	}

	go func() {
		// Create a background context to ensure the database insert succeeds even if the request context is cancelled by user disconnect!
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := s.usageCollection.InsertOne(bgCtx, usageEntry)
		if err != nil {
			log.Printf("[ChatService] Failed to record usage metrics: %v", err)
		}
	}()
}
