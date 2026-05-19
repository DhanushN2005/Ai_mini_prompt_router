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

type geminiProvider struct {
	apiKey string
	client *http.Client
}

// NewGeminiProvider instantiates the Google Gemini API provider.
func NewGeminiProvider(apiKey string) LLMProvider {
	return &geminiProvider{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiSystemInstruction struct {
	Parts []geminiPart `json:"parts"`
}

type geminiGenerationConfig struct {
	Temperature      *float64 `json:"temperature,omitempty"`
	MaxOutputTokens  *int     `json:"maxOutputTokens,omitempty"`
	TopP             *float64 `json:"topP,omitempty"`
	TopK             *int     `json:"topK,omitempty"`
	PresencePenalty  *float64 `json:"presencePenalty,omitempty"`
	FrequencyPenalty *float64 `json:"frequencyPenalty,omitempty"`
}

type geminiRequest struct {
	SystemInstruction *geminiSystemInstruction `json:"systemInstruction,omitempty"`
	Contents          []geminiContent          `json:"contents"`
	GenerationConfig  geminiGenerationConfig   `json:"generationConfig"`
}

type geminiCandidate struct {
	Content struct {
		Parts []geminiPart `json:"parts"`
	} `json:"content"`
}

type geminiUsage struct {
	TotalTokenCount int `json:"totalTokenCount"`
}

type geminiResponse struct {
	Candidates    []geminiCandidate `json:"candidates"`
	UsageMetadata geminiUsage       `json:"usageMetadata"`
	Error         *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (p *geminiProvider) GenerateCompletion(ctx context.Context, model string, systemPrompt string, userPrompt string, opts *GeneratorOptions) (*ChatResponse, error) {
	if p.apiKey == "" || p.apiKey == "your_gemini_api_key_here" {
		return nil, errors.New("Gemini API key is missing or not configured. Update your .env file")
	}

	var systemInstruction *geminiSystemInstruction
	if systemPrompt != "" {
		systemInstruction = &geminiSystemInstruction{
			Parts: []geminiPart{{Text: systemPrompt}},
		}
	}

	contents := []geminiContent{
		{
			Role:  "user",
			Parts: []geminiPart{{Text: userPrompt}},
		},
	}

	genConfig := geminiGenerationConfig{}
	if opts != nil {
		if opts.Temperature != nil {
			genConfig.Temperature = opts.Temperature
		} else {
			defaultTemp := 0.7
			genConfig.Temperature = &defaultTemp
		}
		if opts.MaxTokens != nil {
			genConfig.MaxOutputTokens = opts.MaxTokens
		} else {
			defaultMaxTokens := 1024
			genConfig.MaxOutputTokens = &defaultMaxTokens
		}
		genConfig.TopP = opts.TopP
		genConfig.TopK = opts.TopK
		genConfig.PresencePenalty = opts.PresencePenalty
		genConfig.FrequencyPenalty = opts.FrequencyPenalty
	} else {
		defaultTemp := 0.7
		defaultMaxTokens := 1024
		genConfig.Temperature = &defaultTemp
		genConfig.MaxOutputTokens = &defaultMaxTokens
	}

	reqBody := geminiRequest{
		SystemInstruction: systemInstruction,
		Contents:          contents,
		GenerationConfig:  genConfig,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal gemini request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, p.apiKey)
	
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini network request failed: %w", err)
	}
	defer resp.Body.Close()

	var result geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode gemini response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if result.Error != nil {
			return nil, fmt.Errorf("gemini api error (HTTP %d): %s", resp.StatusCode, result.Error.Message)
		}
		return nil, fmt.Errorf("gemini request failed with status code: %d", resp.StatusCode)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("gemini API returned an empty completion candidates array")
	}

	return &ChatResponse{
		Response:   result.Candidates[0].Content.Parts[0].Text,
		Provider:   ProviderGemini,
		Model:      model,
		TokensUsed: result.UsageMetadata.TotalTokenCount,
	}, nil
}

// GenerateCompletionStream runs Gemini completions and emits typewriter chunk streams SYNCHRONOUSLY.
func (p *geminiProvider) GenerateCompletionStream(ctx context.Context, model string, systemPrompt string, userPrompt string, chunkChan chan<- string, opts *GeneratorOptions) (*ChatResponse, error) {
	resp, err := p.GenerateCompletion(ctx, model, systemPrompt, userPrompt, opts)
	if err != nil {
		return nil, err
	}

	// Dispatch typewriter tokens synchronously to avoid closed channel panic
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
