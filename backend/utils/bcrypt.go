package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword takes a plain text password and returns its bcrypt hash using a cost factor of 12.
// A cost of 12 balances strong cryptographic security with quick processing speed (~100-250ms).
func HashPassword(password string) (string, error) {
	// GenerateFromPassword automatically handles salt generation and hashing.
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedBytes), nil
}

// ComparePasswords compares a hashed password with its suspected plain text equivalent.
// It returns nil if they match, or an error if they do not match.
func ComparePasswords(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
