package auth

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"github.com/username/mini-prompt-router/config"
	"github.com/username/mini-prompt-router/utils"
)

// AuthService outlines all business operations related to registration and sign-in.
type AuthService interface {
	Signup(ctx context.Context, req *SignupRequest) (*AuthResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)
	GetProfile(ctx context.Context, userID string) (*User, error)
}

type authService struct {
	cfg        *config.Config
	collection *mongo.Collection
}

// NewAuthService constructs a new AuthService using clean dependency injection.
func NewAuthService(cfg *config.Config) AuthService {
	return &authService{
		cfg:        cfg,
		collection: config.DB.Collection("users"),
	}
}

// Signup processes the business logic for creating a new user account.
func (s *authService) Signup(ctx context.Context, req *SignupRequest) (*AuthResponse, error) {
	// 1. Verify if the email is already registered in the system.
	existingUser, err := s.findByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email is already registered")
	}

	// 2. Hash the user's plain password.
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 3. Create the domain model for the new user.
	newUser := &User{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
	}

	// 4. Save the user in the database.
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err = s.collection.InsertOne(dbCtx, newUser)
	if err != nil {
		return nil, err
	}

	// 5. Generate a JWT token for the user session.
	token, err := utils.GenerateToken(newUser.ID.Hex(), s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}

	// 6. Formulate the response object.
	response := &AuthResponse{
		Token: token,
	}
	response.User.ID = newUser.ID.Hex()
	response.User.Name = newUser.Name
	response.User.Email = newUser.Email

	return response, nil
}

// Login validates user credentials and grants an authenticated token.
func (s *authService) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	// 1. Query the user by email.
	user, err := s.findByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	// 2. Validate the incoming plain password.
	err = utils.ComparePasswords(user.Password, req.Password)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 3. Generate a JWT token.
	token, err := utils.GenerateToken(user.ID.Hex(), s.cfg.JWTSecret)
	if err != nil {
		return nil, err
	}

	// 4. Return user info and session token.
	response := &AuthResponse{
		Token: token,
	}
	response.User.ID = user.ID.Hex()
	response.User.Name = user.Name
	response.User.Email = user.Email

	return response, nil
}

// GetProfile retrieves the full user profile details from the database using their ID.
func (s *authService) GetProfile(ctx context.Context, userID string) (*User, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var user User
	err = s.collection.FindOne(dbCtx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	
	user.Password = ""
	return &user, nil
}

func (s *authService) findByEmail(ctx context.Context, email string) (*User, error) {
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var user User
	err := s.collection.FindOne(dbCtx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
