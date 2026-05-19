package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims holds our custom fields along with the standard registered JWT claims.
type CustomClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed HS256 JWT token for a specific user ID.
func GenerateToken(userID string, secret string) (string, error) {
	// 1. Establish the claims (payload data).
	// We set an expiration window of 24 hours, and stamp the "Subject" (sub) with the user ID.
	claims := CustomClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}

	// 2. Choose the signing method (Symmetric HMAC-SHA256).
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 3. Cryptographically sign the token using our secret key.
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// ValidateToken parses and cryptographically validates a JWT token string.
// If valid, it returns the parsed token object containing its claims.
func ValidateToken(tokenString string, secret string) (*jwt.Token, error) {
	// ParseWithClaims parses the token and invokes a callback function to retrieve the verification key.
	return jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(t *jwt.Token) (interface{}, error) {
		// Verify that the signing method matches what we expect (HS256).
		// A classic exploit is changing the header algorithm to "none" to bypass validation.
		// We explicitly prevent this by checking the signing method interface.
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
}

// ExtractClaims extracts user information from a validated JWT token.
func ExtractClaims(token *jwt.Token) (*CustomClaims, error) {
	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("failed to cast token claims or token is invalid")
	}
	return claims, nil
}
