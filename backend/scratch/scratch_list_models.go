package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type OpenAIModel struct {
	ID      string `json:"id"`
	OwnedBy string `json:"owned_by"`
}

type OpenAIModelsResponse struct {
	Data []OpenAIModel `json:"data"`
}

type GeminiModel struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Description string `json:"description"`
}

type GeminiModelsResponse struct {
	Models []GeminiModel `json:"models"`
}

func main() {
	// Load env from parent directory since we are in a subfolder!
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found in parent directory, attempting to read environment variables directly.")
	}

	client := &http.Client{Timeout: 10 * time.Second}

	fmt.Println("\n==========================================================================")
	fmt.Println("             MINI PROMPT ROUTER - MASTER DYNAMIC MODEL SCANNER            ")
	fmt.Println("==========================================================================")

	// 1. SCAN OPENAI LIVE API
	scanOpenAI(client)

	// 2. SCAN ANTHROPIC COMPATIBILITY LAYER
	scanAnthropic()

	// 3. SCAN GEMINI LIVE API
	scanGemini(client)

	// 4. SCAN GROQ LIVE API
	scanGroq(client)

	fmt.Println("\n==========================================================================")
	fmt.Println("   Use any listed Model ID (value) to configure your AI Prompt Router bots. ")
	fmt.Println("==========================================================================\n")
}

func scanOpenAI(client *http.Client) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	fmt.Println("\n>>> PROVIDER: \033[1;35mOpenAI\033[0m")
	if apiKey == "" || apiKey == "your_openai_api_key_here" {
		fmt.Println("  \033[1;31m[Skipped] OPENAI_API_KEY is not configured in .env\033[0m")
		return
	}

	req, err := http.NewRequest("GET", "https://api.openai.com/v1/models", nil)
	if err != nil {
		fmt.Printf("  Error creating request: %v\n", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("  Error connecting to OpenAI: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("  API returned HTTP error status: %d (check API key validity)\n", resp.StatusCode)
		return
	}

	var res OpenAIModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		fmt.Printf("  Error decoding JSON: %v\n", err)
		return
	}

	fmt.Println("--------------------------------------------------------------------------")
	fmt.Printf("  %-45s | %s\n", "LIVE MODEL ID (value)", "OWNED BY")
	fmt.Println("--------------------------------------------------------------------------")
	count := 0
	for _, m := range res.Data {
		if strings.Contains(m.ID, "gpt") || strings.Contains(m.ID, "o1") || strings.Contains(m.ID, "o3") {
			fmt.Printf("  \033[1;32m%-45s\033[0m | %s\n", m.ID, m.OwnedBy)
			count++
		}
	}
	if count == 0 && len(res.Data) > 0 {
		limit := 10
		if len(res.Data) < limit {
			limit = len(res.Data)
		}
		for i := 0; i < limit; i++ {
			fmt.Printf("  \033[1;32m%-45s\033[0m | %s\n", res.Data[i].ID, res.Data[i].OwnedBy)
		}
	}
}

func scanAnthropic() {
	fmt.Println("\n>>> PROVIDER: \033[1;35mAnthropic\033[0m")
	fmt.Println("  \033[1;33m[Static API Info] Anthropic does not expose a public models query endpoint.\033[0m")
	fmt.Println("  Official active Claude models in your gateway directory:")
	fmt.Println("  --------------------------------------------------------------------------")
	fmt.Printf("  %-45s | %s\n", "LIVE MODEL ID (value)", "OWNED BY")
	fmt.Println("  --------------------------------------------------------------------------")
	fmt.Printf("  \033[1;32m%-45s\033[0m | Anthropic\n", "claude-3-5-sonnet-20241022")
	fmt.Printf("  \033[1;32m%-45s\033[0m | Anthropic\n", "claude-3-5-haiku-20241022")
	fmt.Printf("  \033[1;32m%-45s\033[0m | Anthropic\n", "claude-3-opus-20240229")
}

func scanGemini(client *http.Client) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	fmt.Println("\n>>> PROVIDER: \033[1;35mGoogle Gemini\033[0m")
	if apiKey == "" || apiKey == "your_gemini_api_key_here" {
		fmt.Println("  \033[1;31m[Skipped] GEMINI_API_KEY is not configured in .env\033[0m")
		return
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
	resp, err := client.Get(url)
	if err != nil {
		fmt.Printf("  Error connecting to Gemini: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("  API returned HTTP error status: %d (check API key validity)\n", resp.StatusCode)
		return
	}

	var res GeminiModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		fmt.Printf("  Error decoding JSON: %v\n", err)
		return
	}

	fmt.Println("--------------------------------------------------------------------------")
	fmt.Printf("  %-45s | %s\n", "LIVE MODEL ID (value)", "DISPLAY NAME")
	fmt.Println("--------------------------------------------------------------------------")
	for _, m := range res.Models {
		id := strings.Replace(m.Name, "models/", "", 1)
		if strings.Contains(id, "gemini") {
			fmt.Printf("  \033[1;32m%-45s\033[0m | %s\n", id, m.DisplayName)
		}
	}
}

func scanGroq(client *http.Client) {
	apiKey := os.Getenv("GROQ_API_KEY")
	fmt.Println("\n>>> PROVIDER: \033[1;35mGroq\033[0m")
	if apiKey == "" || apiKey == "your_groq_api_key_here" {
		fmt.Println("  \033[1;31m[Skipped] GROQ_API_KEY is not configured in .env\033[0m")
		return
	}

	req, err := http.NewRequest("GET", "https://api.groq.com/openai/v1/models", nil)
	if err != nil {
		fmt.Printf("  Error creating request: %v\n", err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("  Error connecting to Groq: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("  API returned HTTP error status: %d\n", resp.StatusCode)
		return
	}

	var res OpenAIModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		fmt.Printf("  Error decoding JSON: %v\n", err)
		return
	}

	fmt.Println("--------------------------------------------------------------------------")
	fmt.Printf("  %-45s | %s\n", "LIVE MODEL ID (value)", "OWNED BY")
	fmt.Println("--------------------------------------------------------------------------")
	for _, m := range res.Data {
		fmt.Printf("  \033[1;32m%-45s\033[0m | %s\n", m.ID, m.OwnedBy)
	}
}
