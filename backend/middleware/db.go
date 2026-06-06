// middleware/db.go
package middleware

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap" // 新增zap导入
	"gorm.io/gorm"
)

// 定义Context的键
type contextKey string

const dbKey contextKey = "db"

// 【修改】InjectDB接收db和logger
func InjectDB(db *gorm.DB, logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(string(dbKey), db)
		logger.Info("数据库连接已注入到Context") // 用Logger打印日志
		c.Next()
	}
}

// GetDB 保持不变
func GetDB(c *gin.Context) *gorm.DB {
	return c.MustGet(string(dbKey)).(*gorm.DB)
}
