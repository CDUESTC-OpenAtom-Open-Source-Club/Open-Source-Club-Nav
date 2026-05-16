// handler/middleware.go
package handler

import (
	"Open-Source-Club-Nav/backend/config"
	"Open-Source-Club-Nav/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware 权限验证中间件（原main.go里的authMiddleware）
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "缺少token"})
			c.Abort()
			return
		}

		// 解析JWT（用config里的secret）
		cfg := config.LoadConfig()
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWT.Secret), nil
		})
		if err != nil || !token.Valid {
			utils.Logger.Warn("token验证失败", err)
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "token无效"})
			c.Abort()
			return
		}

		c.Next()
	}
}
