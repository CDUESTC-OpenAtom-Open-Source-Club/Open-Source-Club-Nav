// backend/middleware/auth.go
package middleware

import (
	"net/http"
	"open-source-club-nav/backend/config"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// SignAuth JWT鉴权中间件
// @Security ApiKeyAuth
// @SecurityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func SignAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 测试环境（DebugMode）临时跳过Token校验
		if gin.Mode() == gin.DebugMode {
			c.Next() // 直接执行后续逻辑
			return
		}
		// 1. 强制检查Authorization是否存在
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "缺少Authorization请求头"})
			c.Abort()
			return
		}

		// 2. 校验格式：Bearer <token>
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "Authorization格式应为Bearer <token>"})
			c.Abort()
			return
		}

		// 3. 解析Token（适配你现有jwt.go的MapClaims）
		tokenStr := parts[1]
		claims := jwt.MapClaims{}
		// 从配置里拿JWT密钥（和你jwt.go里的cfg.JWT.Secret一致）
		cfg := config.LoadConfig()
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWT.Secret), nil
		})

		// 4. 校验Token有效性
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "Token无效或已过期"})
			c.Abort()
			return
		}

		// 5. 将用户信息存入Context（和你jwt.go里的username/role对应）
		c.Set("username", claims["username"])
		c.Set("role", claims["role"])
		c.Next()
	}
}
