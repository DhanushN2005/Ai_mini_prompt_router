package bots

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"github.com/username/mini-prompt-router/config"
)

// BotService defines the business logic operational contracts for AI bots.
type BotService interface {
	CreateBot(ctx context.Context, userID string, req *BotCreateRequest) (*Bot, error)
	GetBotByID(ctx context.Context, id string, userID string) (*Bot, error)
	GetAllBots(ctx context.Context, userID string) ([]*Bot, error)
	UpdateBot(ctx context.Context, id string, userID string, req *BotUpdateRequest) (*Bot, error)
	DeleteBot(ctx context.Context, id string, userID string) error
	GetAvailableModels(ctx context.Context) (map[string][]ModelOption, error)
}

type botService struct {
	collection *mongo.Collection
}

// NewBotService constructs a new BotService.
func NewBotService() BotService {
	return &botService{
		collection: config.DB.Collection("bots"),
	}
}

// CreateBot handles the business flow of creating a new bot.
func (s *botService) CreateBot(ctx context.Context, userID string, req *BotCreateRequest) (*Bot, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	bot := &Bot{
		ID:           primitive.NewObjectID(),
		UserID:       userObjID,
		Name:         req.Name,
		Description:  req.Description,
		Provider:     req.Provider,
		Model:        req.Model,
		SystemPrompt:     req.SystemPrompt,
		Temperature:      req.Temperature,
		MaxTokens:        req.MaxTokens,
		TopP:             req.TopP,
		TopK:             req.TopK,
		PresencePenalty:  req.PresencePenalty,
		FrequencyPenalty: req.FrequencyPenalty,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err = s.collection.InsertOne(dbCtx, bot)
	if err != nil {
		return nil, err
	}

	return bot, nil
}

// GetBotByID fetches a bot while enforcing owner security validation.
func (s *botService) GetBotByID(ctx context.Context, id string, userID string) (*Bot, error) {
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	botObjID, err := primitive.ObjectIDFromHex(id)
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

	var bot Bot
	err = s.collection.FindOne(dbCtx, filter).Decode(&bot)
	if err != nil {
		return nil, err
	}

	return &bot, nil
}

// GetAllBots retrieves all bots owned by the logged-in user.
func (s *botService) GetAllBots(ctx context.Context, userID string) ([]*Bot, error) {
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	filter := bson.M{"user_id": userObjID}

	cursor, err := s.collection.Find(dbCtx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(dbCtx)

	bots := make([]*Bot, 0)
	for cursor.Next(dbCtx) {
		var bot Bot
		if err := cursor.Decode(&bot); err != nil {
			return nil, err
		}
		bots = append(bots, &bot)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return bots, nil
}

// UpdateBot converts a PATCH-like request struct into a clean, targeted database mutation.
func (s *botService) UpdateBot(ctx context.Context, id string, userID string, req *BotUpdateRequest) (*Bot, error) {
	_, err := s.GetBotByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	updateData := bson.M{}
	if req.Name != nil {
		updateData["name"] = *req.Name
	}
	if req.Description != nil {
		updateData["description"] = *req.Description
	}
	if req.Provider != nil {
		updateData["provider"] = *req.Provider
	}
	if req.Model != nil {
		updateData["model"] = *req.Model
	}
	if req.SystemPrompt != nil {
		updateData["system_prompt"] = *req.SystemPrompt
	}
	if req.Temperature != nil {
		updateData["temperature"] = req.Temperature
	}
	if req.MaxTokens != nil {
		updateData["max_tokens"] = req.MaxTokens
	}
	if req.TopP != nil {
		updateData["top_p"] = req.TopP
	}
	if req.TopK != nil {
		updateData["top_k"] = req.TopK
	}
	if req.PresencePenalty != nil {
		updateData["presence_penalty"] = req.PresencePenalty
	}
	if req.FrequencyPenalty != nil {
		updateData["frequency_penalty"] = req.FrequencyPenalty
	}
	
	if len(updateData) == 0 {
		return s.GetBotByID(ctx, id, userID)
	}

	updateData["updated_at"] = time.Now()

	botObjID, _ := primitive.ObjectIDFromHex(id)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	filter := bson.M{
		"_id":     botObjID,
		"user_id": userObjID,
	}

	update := bson.M{
		"$set": updateData,
	}

	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	res, err := s.collection.UpdateOne(dbCtx, filter, update)
	if err != nil {
		return nil, err
	}

	if res.MatchedCount == 0 {
		return nil, mongo.ErrNoDocuments
	}

	return s.GetBotByID(ctx, id, userID)
}

// DeleteBot deletes a bot if owned by the logged-in user.
func (s *botService) DeleteBot(ctx context.Context, id string, userID string) error {
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	botObjID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid bot ID format")
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID format")
	}

	filter := bson.M{
		"_id":     botObjID,
		"user_id": userObjID,
	}

	res, err := s.collection.DeleteOne(dbCtx, filter)
	if err != nil {
		return err
	}

	if res.DeletedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

// GetAvailableModels returns the clean, curated catalog of supported models.
func (s *botService) GetAvailableModels(ctx context.Context) (map[string][]ModelOption, error) {
	result := map[string][]ModelOption{
		"OpenAI": {
			{Value: "gpt-4.1-mini", Label: "GPT-4.1 Mini (Fast + Cost Efficient)"},
			{Value: "gpt-4.1", Label: "GPT-4.1 (Advanced Production Intelligence)"},
			{Value: "gpt-4o-mini", Label: "GPT-4o Mini (Realtime Lightweight)"},
			{Value: "gpt-4o", Label: "GPT-4o (Omni Multimodal Flagship)"},
			{Value: "o3-mini", Label: "O3 Mini (Reasoning Optimized)"},
			{Value: "o3", Label: "O3 (Deep Multi-Step Reasoning)"},
		},
		"Anthropic": {
			{Value: "claude-3-7-sonnet-latest", Label: "Claude 3.7 Sonnet (Best Coding + Reasoning)"},
			{Value: "claude-3-5-sonnet-latest", Label: "Claude 3.5 Sonnet (Stable Enterprise Standard)"},
			{Value: "claude-3-5-haiku-latest", Label: "Claude 3.5 Haiku (Ultra Fast & Cheap)"},
			{Value: "claude-3-opus-latest", Label: "Claude 3 Opus (Long-Form Deep Thinking)"},
		},
		"Google Gemini": {
			{Value: "gemini-2.0-flash", Label: "Gemini 2.0 Flash (Realtime Ultra Fast)"},
			{Value: "gemini-2.0-pro", Label: "Gemini 2.0 Pro (Pro Level Logic)"},
			{Value: "gemini-1.5-flash", Label: "Gemini 1.5 Flash (Standard Low Latency)"},
			{Value: "gemini-1.5-pro", Label: "Gemini 1.5 Pro (Deep Multimodal Context)"},
		},
		"Groq": {
			{Value: "llama-3.3-70b-versatile", Label: "Llama 3.3 70B (Open Flagship)"},
			{Value: "llama-3.1-8b-instant", Label: "Llama 3.1 8B (Instant Inference)"},
			{Value: "mixtral-8x7b-32768", Label: "Mixtral 8x7B (Efficient MoE Reasoning)"},
			{Value: "gemma2-9b-it", Label: "Gemma 2 9B (Lightweight Google Model)"},
		},
		"Meta": {
			{Value: "llama-3.3-70b", Label: "Llama 3.3 70B (Enterprise OSS Model)"},
			{Value: "llama-3.1-405b", Label: "Llama 3.1 405B (Massive Frontier OSS)"},
			{Value: "llama-3.1-70b", Label: "Llama 3.1 70B (Balanced Performance)"},
		},
		"Mistral": {
			{Value: "mistral-large-latest", Label: "Mistral Large (European Frontier Model)"},
			{Value: "mistral-medium-latest", Label: "Mistral Medium (Balanced Enterprise)"},
			{Value: "codestral-latest", Label: "Codestral (Code Generation Specialist)"},
		},
		"DeepSeek": {
			{Value: "deepseek-chat", Label: "DeepSeek Chat (Efficient General AI)"},
			{Value: "deepseek-reasoner", Label: "DeepSeek Reasoner (Chain-of-Thought Focused)"},
		},
		"xAI": {
			{Value: "grok-2", Label: "Grok 2 (Realtime Web-Aware AI)"},
			{Value: "grok-2-mini", Label: "Grok 2 Mini (Fast Lightweight Variant)"},
		},
	}

	return result, nil
}
