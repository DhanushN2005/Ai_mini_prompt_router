package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type anthropicProvider struct {
	apiKey string
	client *http.Client
}

// NewAnthropicProvider instantiates the Anthropic API provider integration.
func NewAnthropicProvider(apiKey string) LLMProvider {
	return &anthropicProvider{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicRequest struct {
	Model       string             `json:"model"`
	System      string             `json:"system"`
	Messages    []anthropicMessage `json:"messages"`
	MaxTokens   int                `json:"max_tokens"`
	Temperature *float64           `json:"temperature,omitempty"`
	TopP        *float64           `json:"top_p,omitempty"`
	TopK        *int               `json:"top_k,omitempty"`
}

type anthropicContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type anthropicUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

type anthropicResponse struct {
	Model   string             `json:"model"`
	Content []anthropicContent `json:"content"`
	Usage   anthropicUsage     `json:"usage"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (p *anthropicProvider) GenerateCompletion(ctx context.Context, model string, systemPrompt string, userPrompt string, opts *GeneratorOptions) (*ChatResponse, error) {
	apiKey := p.apiKey
	if ctxKey, ok := ctx.Value("X-Anthropic-API-Key").(string); ok && ctxKey != "" {
		apiKey = ctxKey
	}
	if apiKey == "" || apiKey == "your_anthropic_api_key_here" {
		return nil, errors.New("Anthropic API key is missing or not configured. Update your .env file or settings")
	}

	messages := []anthropicMessage{
		{Role: "user", Content: userPrompt},
	}

	maxTokens := 1024
	if opts != nil && opts.MaxTokens != nil && *opts.MaxTokens > 0 {
		maxTokens = *opts.MaxTokens
	}

	reqBody := anthropicRequest{
		Model:     model,
		System:    systemPrompt,
		Messages:  messages,
		MaxTokens: maxTokens,
	}

	if opts != nil {
		reqBody.Temperature = opts.Temperature
		reqBody.TopP = opts.TopP
		reqBody.TopK = opts.TopK
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal anthropic request: %w", err)
	}

	url := "https://api.anthropic.com/v1/messages"
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("content-type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("anthropic network request failed: %w", err)
	}
	defer resp.Body.Close()

	var result anthropicResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode anthropic response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if result.Error != nil {
			return nil, fmt.Errorf("anthropic api error (HTTP %d): %s", resp.StatusCode, result.Error.Message)
		}
		return nil, fmt.Errorf("anthropic request failed with status code: %d", resp.StatusCode)
	}

	if len(result.Content) == 0 {
		return nil, errors.New("anthropic API returned an empty completion content array")
	}

	totalTokens := result.Usage.InputTokens + result.Usage.OutputTokens

	return &ChatResponse{
		Response:   result.Content[0].Text,
		Provider:   ProviderAnthropic,
		Model:      result.Model,
		TokensUsed: totalTokens,
	}, nil
}

// GenerateCompletionStream runs Anthropic completions and emits typewriter chunk streams SYNCHRONOUSLY.
func (p *anthropicProvider) GenerateCompletionStream(ctx context.Context, model string, systemPrompt string, userPrompt string, chunkChan chan<- string, opts *GeneratorOptions) (*ChatResponse, error) {
	resp, err := p.GenerateCompletion(ctx, model, systemPrompt, userPrompt, opts)
	if err != nil {
		return nil, err
	}

	// Dispatch typewriter tokens synchronously to match standard blocking provider behavior
	words := strings.Fields(resp.Response)
	for i, word := range words {
		space := " "
		if i == len(words)-1 {
			space = ""
		}
		select {
		case <-ctx.Done():
			return resp, nil
		case chunkChan <- (word + space):
			time.Sleep(30 * time.Millisecond)
		}
	}

	return resp, nil
}
