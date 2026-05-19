package dashboard

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/controller/chat"
)

// UsageSummary aggregates total metrics for rendering in the dashboard.
type UsageSummary struct {
	TotalCalls      int            `json:"total_calls"`
	TotalTokens     int            `json:"total_tokens"`
	TotalBots       int            `json:"total_bots"`
	ProviderMetrics map[string]int `json:"provider_metrics"` // Provider -> Token count
	RecentLogs      []chat.UsageLog     `json:"recent_logs"`
}

// DashboardService coordinates aggregating metrics for dashboard reporting.
type DashboardService interface {
	GetSummary(ctx context.Context, userID string) (*UsageSummary, error)
}

type dashboardService struct {
	usageCollection *mongo.Collection
	botsCollection  *mongo.Collection
}

// NewDashboardService instantiates a new DashboardService.
func NewDashboardService() DashboardService {
	return &dashboardService{
		usageCollection: config.DB.Collection("usage_logs"),
		botsCollection:  config.DB.Collection("bots"),
	}
}

func (s *dashboardService) GetSummary(ctx context.Context, userID string) (*UsageSummary, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cursor, err := s.usageCollection.Find(dbCtx, bson.M{"user_id": uid})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(dbCtx)

	var logs []chat.UsageLog
	if err := cursor.All(dbCtx, &logs); err != nil {
		return nil, err
	}

	totalCalls := len(logs)
	totalTokens := 0
	providerMetrics := map[string]int{
		"OpenAI":        0,
		"Anthropic":     0,
		"Google Gemini": 0,
		"Gemini":        0, // Fallback
		"Groq":          0,
		"Meta":          0,
		"Mistral":       0,
		"DeepSeek":      0,
		"xAI":           0,
	}

	for _, l := range logs {
		totalTokens += l.TokensUsed
		providerMetrics[l.Provider] += l.TokensUsed
	}

	// Normalize 'Gemini' and 'Google Gemini' metrics
	if providerMetrics["Gemini"] > 0 {
		providerMetrics["Google Gemini"] += providerMetrics["Gemini"]
		delete(providerMetrics, "Gemini")
	}

	totalBots, _ := s.botsCollection.CountDocuments(dbCtx, bson.M{"user_id": uid})

	findOpts := options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(5)
	recentLogs := []chat.UsageLog{}
	recentCursor, err := s.usageCollection.Find(dbCtx, bson.M{"user_id": uid}, findOpts)
	if err == nil {
		_ = recentCursor.All(dbCtx, &recentLogs)
		recentCursor.Close(dbCtx)
	}

	return &UsageSummary{
		TotalCalls:      totalCalls,
		TotalTokens:     totalTokens,
		TotalBots:       int(totalBots),
		ProviderMetrics: providerMetrics,
		RecentLogs:      recentLogs,
	}, nil
}
