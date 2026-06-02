// utils/jwt.go
package utils

import (
	"open-source-club-nav/backend/config"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 1. 定义带标准字段的MyClaims结构体（必须加，否则代码会报错）
type MyClaims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	Iss      string `json:"iss"` // 签发者
	Aud      string `json:"aud"` // 受众
	Iat      int64  `json:"iat"` // 签发时间
	Exp      int64  `json:"exp"` // 过期时间
	jwt.RegisteredClaims
}

// 2. JWT密钥缓存（解决每次重读配置）
var jwtSecret []byte
var secretOnce sync.Once

func getJWTSecret() []byte {
	secretOnce.Do(func() {
		cfg := config.LoadConfig()
		jwtSecret = []byte(cfg.JWT.Secret)
	})
	return jwtSecret
}

// 3. 修复后的GenerateToken（和你写的逻辑一致，只是补了MyClaims定义）
func GenerateToken(username, role string) (string, error) {
	// 从配置读过期时间
	cfg := config.LoadConfig()
	expireDuration := time.Duration(cfg.JWT.Expire) * time.Second

	// 填充Claims
	claims := MyClaims{
		Username: username,
		Role:     role,
		Iss:      "Open-Source-Club-Nav",
		Aud:      "backend-api",
		Iat:      time.Now().Unix(),
		Exp:      time.Now().Add(expireDuration).Unix(),
	}

	// 生成Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}
