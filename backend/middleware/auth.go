package middleware

import (
	"encoding/json"
	"net/http"

	"open-source-club-nav/backend/utils" // 导入之前的utils（含Redis、APIError）

	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
)

// SignAuth 基于Redis+安全Session的管理员Cookie鉴权
// SignAuth 改为Cookie鉴权（验证kcos_admin_session）
// 验证通过后将 userID、username、role 写入 Context，供后续 RBAC 使用。
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

		// 改成（直接解析为model.User）：
		var admin model.User
		if err := json.Unmarshal(userInfoBytes, &admin); err != nil {
			c.JSON(http.StatusUnauthorized, &utils.APIError{
				Code:    http.StatusUnauthorized,
				Message: "Session信息损坏",
			})
			c.Abort()
			return
		}
		c.Set("userID", admin.ID)
		c.Set("username", admin.Username)
		c.Set("role", admin.Role)

		// 4. 验证通过，继续执行后续接口
		c.Next()
	}
}
