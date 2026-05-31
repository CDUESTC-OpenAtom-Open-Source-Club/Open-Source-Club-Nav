// backend/middleware/session.go
package middleware

import (
	"strconv"
	"time"
)

// GenerateAdminSession 生成管理员Session（用于Cookie存储）
// 逻辑：用户ID + 时间戳拼接（简单示例，实际可加加密/签名）
func GenerateAdminSession(userID uint) string {
	// 把用户ID转成字符串
	userIDStr := strconv.FormatUint(uint64(userID), 10)
	// 把当前时间戳转成字符串
	timestampStr := strconv.FormatInt(time.Now().Unix(), 10)
	// 拼接成Session字符串（比如："1_1717245600"）
	return userIDStr + "_" + timestampStr
}
