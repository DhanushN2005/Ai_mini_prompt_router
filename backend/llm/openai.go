package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type openAIProvider struct {
	apiKey   string
	baseURL  string
	provider string
	client   *http.Client
}

// NewOpenAIProvider creates an instance of our OpenAI provider client.
func NewOpenAIProvider(apiKey string) LLMProvider {
	return &openAIProvider{
		apiKey:   apiKey,
		baseURL:  "https://api.openai.com/v1",
		provider: ProviderOpenAI,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewGroqProvider creates a Groq provider client using OpenAI endpoints.
func NewGroqProvider(apiKey string) LLMProvider {
	return &openAIProvider{
		apiKey:   apiKey,
		baseURL:  "https://api.groq.com/openai/v1",
		provider: ProviderGroq,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewOpenAICompatibleProvider creates a generic client for any OpenAI-compatible API gateway.
func NewOpenAICompatibleProvider(provider string, baseURL string, apiKey string) LLMProvider {
	return &openAIProvider{
		apiKey:   apiKey,
		baseURL:  baseURL,
		provider: provider,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIRequest struct {
	Model            string          `json:"model"`
	Messages         []openAIMessage `json:"messages"`
	Temperature      *float64        `json:"temperature,omitempty"`
	MaxTokens        *int            `json:"max_tokens,omitempty"`
	TopP             *float64        `json:"top_p,omitempty"`
	PresencePenalty  *float64        `json:"presence_penalty,omitempty"`
	FrequencyPenalty *float64        `json:"frequency_penalty,omitempty"`
	Stream           bool            `json:"stream,omitempty"`
}

type openAIChoice struct {
	Message openAIMessage `json:"message"`
}

type openAIUsage struct {
	TotalTokens int `json:"total_tokens"`
}

type openAIResponse struct {
	Model   string         `json:"model"`
	Choices []openAIChoice `json:"choices"`
	Usage   openAIUsage    `json:"usage"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (p *openAIProvider) GenerateCompletion(ctx context.Context, model string, systemPrompt string, userPrompt string, opts *GeneratorOptions) (*ChatResponse, error) {
	if p.apiKey == "" || p.apiKey == "your_openai_api_key_here" || p.apiKey == "your_groq_api_key_here" {
		return nil, fmt.Errorf("%s API key is missing or not configured. Update your .env file", p.provider)
	}

	messages := []openAIMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	reqBody := openAIRequest{
		Model:    model,
		Messages: messages,
	}

	if opts != nil {
		if opts.Temperature != nil {
			reqBody.Temperature = opts.Temperature
		} else {
			defaultTemp := 0.7
			reqBody.Temperature = &defaultTemp
		}
		reqBody.MaxTokens = opts.MaxTokens
		reqBody.TopP = opts.TopP
		reqBody.PresencePenalty = opts.PresencePenalty
		reqBody.FrequencyPenalty = opts.FrequencyPenalty
	} else {
		defaultTemp := 0.7
		reqBody.Temperature = &defaultTemp
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal %s request: %w", p.provider, err)
	}

	url := fmt.Sprintf("%s/chat/completions", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%s network request failed: %w", p.provider, err)
	}
	defer resp.Body.Close()

	var result openAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode %s response: %w", p.provider, err)
	}

	if resp.StatusCode != http.StatusOK {
		if result.Error != nil {
			return nil, fmt.Errorf("%s api error (HTTP %d): %s", p.provider, resp.StatusCode, result.Error.Message)
		}
		return nil, fmt.Errorf("%s request failed with status code: %d", p.provider, resp.StatusCode)
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("%s API returned an empty completion choices array", p.provider)
	}

	return &ChatResponse{
		Response:   result.Choices[0].Message.Content,
		Provider:   p.provider,
		Model:      model,
		TokensUsed: result.Usage.TotalTokens,
	}, nil
}

func (p *openAIProvider) GenerateCompletionStream(ctx context.Context, model string, systemPrompt string, userPrompt string, chunkChan chan<- string, opts *GeneratorOptions) (*ChatResponse, error) {
	if p.apiKey == "" || p.apiKey == "your_openai_api_key_here" || p.apiKey == "your_groq_api_key_here" {
		return nil, fmt.Errorf("%s API key is missing or not configured. Update your .env file", p.provider)
	}

	messages := []openAIMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	reqBody := openAIRequest{
		Model:    model,
		Messages: messages,
		Stream:   true,
	}

	if opts != nil {
		if opts.Temperature != nil {
			reqBody.Temperature = opts.Temperature
		} else {
			defaultTemp := 0.7
			reqBody.Temperature = &defaultTemp
		}
		reqBody.MaxTokens = opts.MaxTokens
		reqBody.TopP = opts.TopP
		reqBody.PresencePenalty = opts.PresencePenalty
		reqBody.FrequencyPenalty = opts.FrequencyPenalty
	} else {
		defaultTemp := 0.7
		reqBody.Temperature = &defaultTemp
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/chat/completions", p.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s streaming request failed with status code: %d", p.provider, resp.StatusCode)
	}

	reader := bufio.NewReader(resp.Body)
	var fullText strings.Builder

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, fmt.Errorf("failed to read stream chunk: %w", err)
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if !strings.HasPrefix(line, "data:") {
			continue
		}

		dataStr := strings.TrimPrefix(line, "data:")
		dataStr = strings.TrimSpace(dataStr)
		if dataStr == "[DONE]" {
			break
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}

		if err := json.Unmarshal([]byte(dataStr), &chunk); err != nil {
			continue
		}

		if len(chunk.Choices) > 0 {
			content := chunk.Choices[0].Delta.Content
			if content != "" {
				fullText.WriteString(content)
				select {
				case <-ctx.Done():
					return &ChatResponse{
						Response:   fullText.String(),
						Provider:   p.provider,
						Model:      model,
						TokensUsed: len(fullText.String()) / 4,
					}, nil
				case chunkChan <- content:
				}
			}
		}
	}

	return &ChatResponse{
		Response:   fullText.String(),
		Provider:   p.provider,
		Model:      model,
		TokensUsed: len(fullText.String()) / 4,
	}, nil
}
