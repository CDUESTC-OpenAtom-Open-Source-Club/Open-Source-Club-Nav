package utils

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// RedisClient 全局Redis客户端
var RedisClient *redis.Client

// InitRedis 初始化Redis连接（在项目启动时调用）
func InitRedis(addr, password string, db int) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     addr, // 比如 "localhost:6379"
		Password: password,
		DB:       db,
	})
	// 测试连接
	_, err := RedisClient.Ping(context.Background()).Result()
	return err
}
