// utils/logger.go
package utils

import "go.uber.org/zap"

var Logger *zap.Logger

// 初始化日志
func InitLogger() {
    Logger, _ = zap.NewProduction() // 实际项目可以用NewDevelopment()
}

// 同步日志
func SyncLogger() {
    _ = Logger.Sync()
}
