package llm

import (
	"fmt"
	"os"
	"strings"

	"github.com/username/mini-prompt-router/config"
)

// LLMRouter defines the factory contract to dynamically obtain concrete AI API integrations.
type LLMRouter interface {
	Route(providerName string) (LLMProvider, error)
}

type llmRouter struct {
	cfg *config.Config
}

// NewLLMRouter instantiates our router factory with access to environmental configurations.
func NewLLMRouter(cfg *config.Config) LLMRouter {
	return &llmRouter{
		cfg: cfg,
	}
}

// Route acts as the factory, mapping the provider string to its corresponding concrete implementation.
func (r *llmRouter) Route(providerName string) (LLMProvider, error) {
	normalizedName := strings.ToLower(strings.TrimSpace(providerName))

	switch normalizedName {
	case "openai":
		return NewOpenAIProvider(r.cfg.OpenAIApiKey), nil

	case "anthropic":
		return NewAnthropicProvider(r.cfg.AnthropicApiKey), nil

	case "gemini", "google gemini":
		return NewGeminiProvider(r.cfg.GeminiApiKey), nil

	case "groq":
		return NewGroqProvider(r.cfg.GroqApiKey), nil

	case "meta":
		return NewGroqProvider(r.cfg.GroqApiKey), nil

	case "mistral":
		mistralKey := os.Getenv("MISTRAL_API_KEY")
		if mistralKey == "" {
			mistralKey = r.cfg.GroqApiKey
		}
		return NewOpenAICompatibleProvider("Mistral", "https://api.mistral.ai/v1", mistralKey), nil

	case "deepseek":
		return NewOpenAICompatibleProvider("DeepSeek", "https://api.deepseek.com", os.Getenv("DEEPSEEK_API_KEY")), nil

	case "xai":
		return NewOpenAICompatibleProvider("xAI", "https://api.x.ai/v1", os.Getenv("XAI_API_KEY")), nil

	default:
		return nil, fmt.Errorf("unsupported AI provider: '%s'. Supported providers: OpenAI, Anthropic, Google Gemini, Groq, Meta, Mistral, DeepSeek, xAI", providerName)
	}
}
