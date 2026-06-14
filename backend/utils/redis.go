package utils

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient 全局Redis客户端
var RedisClient *redis.Client

// InitRedis 初始化Redis连接（在项目启动时调用）
func InitRedis(addr, password string, db int) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           db,
		PoolSize:     8,
		MinIdleConns: 1,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})
	// 测试连接
	_, err := RedisClient.Ping(context.Background()).Result()
	return err
}
