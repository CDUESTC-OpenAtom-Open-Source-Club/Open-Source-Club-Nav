// middleware/auth.go
package middleware

import (
	"net/http"
	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SignAuth 改为Cookie鉴权（验证kcos_admin_session）
// 验证通过后将 userID、username、role 写入 Context，供后续 RBAC 使用。
func SignAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从Cookie中获取session
		session, err := c.Cookie("kcos_admin_session")
		if err != nil || session == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "缺少管理员Session"})
			c.Abort()
			return
		}

		// 2. 从数据库验证session是否有效
		db := c.MustGet("db").(*gorm.DB)
		var admin model.User
		if err := db.Where("session = ?", session).First(&admin).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"msg": "Session无效或已过期"})
			c.Abort()
			return
		}

		// 3. 将用户信息写入 Context，供 RequireRole 等中间件使用
		c.Set("userID", admin.ID)
		c.Set("username", admin.Username)
		c.Set("role", admin.Role)

		// 4. 验证通过，继续执行后续接口
		c.Next()
	}
}
