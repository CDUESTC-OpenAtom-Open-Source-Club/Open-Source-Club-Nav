package middleware

import (
	"encoding/json"
	"net/http"
	"open-source-club-nav/backend/utils" // 导入之前的utils（含Redis、APIError）

	"github.com/gin-gonic/gin"
)

// SignAuth 基于Redis+安全Session的管理员Cookie鉴权
func SignAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从Cookie获取管理员Session（对应登录时设置的"kcos_admin_session"）
		session, err := c.Cookie("kcos_admin_session")
		if err != nil || session == "" {
			c.JSON(http.StatusUnauthorized, &utils.APIError{
				Code:    http.StatusUnauthorized,
				Message: "缺少管理员Session,请登录",
			})
			c.Abort()
			return
		}

		// 2. 从Redis校验管理员Session（前缀用"admin_session:"）
		ctx := c.Request.Context()
		userInfoBytes, err := utils.RedisClient.Get(ctx, "admin_session:"+session).Bytes()
		if err != nil {
			c.JSON(http.StatusUnauthorized, &utils.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Session无效或已过期,请重新登录",
			})
			c.Abort()
			return
		}

		// 3. 解析管理员信息并注入Context
		var userInfo map[string]interface{}
		if err := json.Unmarshal(userInfoBytes, &userInfo); err != nil {
			c.JSON(http.StatusUnauthorized, &utils.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Session信息损坏",
			})
			c.Abort()
			return
		}
		c.Set("admin_user", userInfo)

		// 4. 验证通过，继续执行后续接口
		c.Next()
	}
}
