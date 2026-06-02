// handler/middleware.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/config"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

func AuthMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		// 兼容 "Bearer <token>" 格式
		tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")
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

		// 3. 把utils.Logger替换成注入的logger
		if err != nil || !token.Valid {
			logger.Warn("token验证失败", zap.Error(err)) // 用注入的logger
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "token无效"})
			c.Abort()
			return
		}

		// 解析claims并写入Context，供后续RBAC使用
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "token无效"})
			c.Abort()
			return
		}
		if username, ok := claims["username"].(string); ok {
			c.Set("username", username)
		}
		if role, ok := claims["role"].(string); ok {
			c.Set("role", role)
		}

		c.Next()
	}
}

// RequireRole 校验登录用户角色是否在允许列表内（需在 AuthMiddleware 之后使用）。
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		roleStr, _ := role.(string)
		if _, ok := allowed[roleStr]; !ok {
			c.JSON(http.StatusForbidden, gin.H{"msg": "无权限"})
			c.Abort()
			return
		}
		c.Next()
	}
}
