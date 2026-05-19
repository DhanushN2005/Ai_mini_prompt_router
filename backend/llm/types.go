package llm

import (
	"context"
)

// Supported LLM Providers as constants
const (
	ProviderOpenAI    = "OpenAI"
	ProviderAnthropic = "Anthropic"
	ProviderGemini    = "Gemini"
	ProviderGroq      = "Groq"
)

// ChatResponse is the normalized response returned to our frontend client and chat services.
type ChatResponse struct {
	Response   string `json:"response"`
	Provider   string `json:"provider"`
	Model      string `json:"model"`
	TokensUsed int    `json:"tokens_used"`
}

// GeneratorOptions specifies optional parameter overrides for LLM generations.
type GeneratorOptions struct {
	Temperature      *float64 `json:"temperature,omitempty"`
	MaxTokens        *int     `json:"max_tokens,omitempty"`
	TopP             *float64 `json:"top_p,omitempty"`
	TopK             *int     `json:"top_k,omitempty"`
	PresencePenalty  *float64 `json:"presence_penalty,omitempty"`
	FrequencyPenalty *float64 `json:"frequency_penalty,omitempty"`
}

// LLMProvider defines the interface all concrete AI providers must implement.
type LLMProvider interface {
	GenerateCompletion(ctx context.Context, model string, systemPrompt string, userPrompt string, opts *GeneratorOptions) (*ChatResponse, error)
	GenerateCompletionStream(ctx context.Context, model string, systemPrompt string, userPrompt string, chunkChan chan<- string, opts *GeneratorOptions) (*ChatResponse, error)
}
