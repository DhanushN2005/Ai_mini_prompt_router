package chat

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ChatRequest defines the payload expected from the client to trigger a chat completion.
type ChatRequest struct {
	BotID  string `json:"bot_id" validate:"required"`
	Prompt string `json:"prompt" validate:"required"`
}

// UsageLog records a single successful completion call and its token consumption.
type UsageLog struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID `bson:"user_id" json:"user_id"`
	BotID      primitive.ObjectID `bson:"bot_id" json:"bot_id"`
	BotName    string             `bson:"bot_name" json:"bot_name"`
	Provider   string             `bson:"provider" json:"provider"`
	Model      string             `bson:"model" json:"model"`
	TokensUsed int                `bson:"tokens_used" json:"tokens_used"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
}
