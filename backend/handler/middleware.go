// handler/middleware.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "缺少token"})
			c.Abort()
			return
		}

		cfg := config.LoadConfig()
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, http.ErrAbortHandler
			}
			return []byte(cfg.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			utils.Logger.Warn("token验证失败", zap.Error(err))
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "token无效"})
			c.Abort()
			return
		}

		c.Next()
	}
}
