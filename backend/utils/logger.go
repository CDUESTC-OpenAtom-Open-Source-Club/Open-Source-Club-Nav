package utils

import (
	"log"

	"go.uber.org/zap"
)

// 新增：全局导出的Logger变量（首字母大写）
var Logger *zap.Logger

func InitLogger() *zap.Logger {
	logger, err := zap.NewProduction() // 开发环境用zap.NewDevelopment()
	if err != nil {
		log.Fatalf("logger初始化失败: %v", err)
	}
	// 把初始化后的logger赋值给全局变量
	Logger = logger
	return logger
}

func SyncLogger(logger *zap.Logger) {
	_ = logger.Sync()
}
