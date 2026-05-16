// utils/jwt.go
package utils

import (
	"open-source-club-nav/backend/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 生成JWT Token
func GenerateToken(username string) (string, error) {
	cfg := config.LoadConfig()
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Second * time.Duration(cfg.JWT.Expire)).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}
