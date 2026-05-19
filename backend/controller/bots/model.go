package bots

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Supported LLM Providers as constants to prevent typos and ensure strict data safety
const (
	ProviderOpenAI    = "OpenAI"
	ProviderAnthropic = "Anthropic"
	ProviderGemini    = "Gemini"
	ProviderGroq      = "Groq"
)

// Bot represents the BSON database entity and the JSON API contract for an AI Bot.
type Bot struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"user_id" json:"user_id"`
	Name         string             `bson:"name" json:"name"`
	Description  string             `bson:"description" json:"description"`
	Provider     string             `bson:"provider" json:"provider"`
	Model        string             `bson:"model" json:"model"`
	SystemPrompt     string             `bson:"system_prompt" json:"system_prompt"`
	Temperature      *float64           `bson:"temperature,omitempty" json:"temperature,omitempty"`
	MaxTokens        *int               `bson:"max_tokens,omitempty" json:"max_tokens,omitempty"`
	TopP             *float64           `bson:"top_p,omitempty" json:"top_p,omitempty"`
	TopK             *int               `bson:"top_k,omitempty" json:"top_k,omitempty"`
	PresencePenalty  *float64           `bson:"presence_penalty,omitempty" json:"presence_penalty,omitempty"`
	FrequencyPenalty *float64           `bson:"frequency_penalty,omitempty" json:"frequency_penalty,omitempty"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time          `bson:"updated_at" json:"updated_at"`
}

// BotCreateRequest defines what we expect from the frontend when creating a bot.
type BotCreateRequest struct {
	Name         string `json:"name" validate:"required"`
	Description  string `json:"description"`
	Provider     string `json:"provider" validate:"required"`
	Model        string `json:"model" validate:"required"`
	SystemPrompt     string   `json:"system_prompt" validate:"required"`
	Temperature      *float64 `json:"temperature"`
	MaxTokens        *int     `json:"max_tokens"`
	TopP             *float64 `json:"top_p"`
	TopK             *int     `json:"top_k"`
	PresencePenalty  *float64 `json:"presence_penalty"`
	FrequencyPenalty *float64 `json:"frequency_penalty"`
}

// BotUpdateRequest defines the payload allowed for partial bot updates.
type BotUpdateRequest struct {
	Name         *string `json:"name" validate:"omitempty"`
	Description  *string `json:"description" validate:"omitempty"`
	Provider     *string `json:"provider" validate:"omitempty"`
	Model        *string `json:"model" validate:"omitempty"`
	SystemPrompt     *string  `json:"system_prompt" validate:"omitempty"`
	Temperature      *float64 `json:"temperature" validate:"omitempty"`
	MaxTokens        *int     `json:"max_tokens" validate:"omitempty"`
	TopP             *float64 `json:"top_p" validate:"omitempty"`
	TopK             *int     `json:"top_k" validate:"omitempty"`
	PresencePenalty  *float64 `json:"presence_penalty" validate:"omitempty"`
	FrequencyPenalty *float64 `json:"frequency_penalty" validate:"omitempty"`
}

// ModelOption defines a standardized serializable dropdown choice for the frontend.
type ModelOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}
