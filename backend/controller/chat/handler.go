package chat

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/username/mini-prompt-router/llm"
)

// ChatController handles HTTP requests for dispatching user prompts.
type ChatController struct {
	chatService ChatService
}

// NewChatController creates an instance of ChatController.
func NewChatController(chatService ChatService) *ChatController {
	return &ChatController{
		chatService: chatService,
	}
}

// SendPrompt handles POST /api/chat requests and streams completions to the client via SSE
func (ctrl *ChatController) SendPrompt(c echo.Context) error {
	req := new(ChatRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body format")
	}

	if err := c.Validate(req); err != nil {
		return err
	}

	userID, ok := c.Get("user_id").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User context credentials not found")
	}

	c.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
	c.Response().Header().Set(echo.HeaderCacheControl, "no-cache")
	c.Response().Header().Set(echo.HeaderConnection, "keep-alive")
	c.Response().WriteHeader(http.StatusOK)

	chunkChan := make(chan string, 100)
	
	type streamResult struct {
		resp *llm.ChatResponse
		err  error
	}
	resultChan := make(chan streamResult, 1)

	go func() {
		resp, err := ctrl.chatService.ProcessChatStream(c.Request().Context(), userID, req, chunkChan)
		close(chunkChan)
		resultChan <- streamResult{resp: resp, err: err}
	}()

	for chunk := range chunkChan {
		payload, err := json.Marshal(map[string]string{"token": chunk})
		if err == nil {
			_, _ = fmt.Fprintf(c.Response().Writer, "data: %s\n\n", string(payload))
			c.Response().Flush()
		}
	}

	res := <-resultChan
	if res.err != nil {
		errPayload, _ := json.Marshal(map[string]string{"error": res.err.Error()})
		_, _ = fmt.Fprintf(c.Response().Writer, "data: %s\n\n", string(errPayload))
		c.Response().Flush()
		return nil
	}

	metaPayload, _ := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{
			"provider":    res.resp.Provider,
			"model":       res.resp.Model,
			"tokens_used": res.resp.TokensUsed,
		},
	})
	_, _ = fmt.Fprintf(c.Response().Writer, "data: %s\n\n", string(metaPayload))
	c.Response().Flush()

	_, _ = fmt.Fprintf(c.Response().Writer, "data: [DONE]\n\n")
	c.Response().Flush()

	return nil
}
