// main.go
package main

import (
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/db/migrate"
	_ "open-source-club-nav/backend/docs"
	"open-source-club-nav/backend/router"
	"open-source-club-nav/backend/utils"

	migrateLib "github.com/golang-migrate/migrate/v4"
	"go.uber.org/zap" // 新增zap的导入
	"gorm.io/driver/mysql"

	"gorm.io/gorm"
)

func main() {
	// 先获取单例配置
	cfg := config.GetConfig()

	// 初始化日志
	logger := utils.InitLogger()
	defer utils.SyncLogger(logger)

	// 用BuildDSN替换原来的DSN
	db, err := gorm.Open(mysql.Open(cfg.BuildDSN()), &gorm.Config{})
	if err != nil {
		logger.Fatal("数据库连接失败", zap.Error(err))
	}

	migrateDSN := "mysql://" + cfg.BuildDSN()
	if err := migrate.Run(migrateDSN); err != nil && err != migrateLib.ErrNoChange {
		logger.Fatal("数据库迁移失败", zap.Error(err))
	}

	// 初始化 Redis
	if err := utils.InitRedis(cfg.Redis.Addr, cfg.Redis.Password, cfg.Redis.DB); err != nil {
		logger.Fatal("Redis 连接失败", zap.Error(err))
	}
	logger.Info("Redis 连接成功")

	// ---------------------------------------------------
	// 初始化路由

	r := router.InitRouter(db, cfg)
	r.Run()

	// 启动服务
	logger.Info("服务启动成功，监听端口: 8080")
	if err := r.Run(":8080"); err != nil { // 补全err判断，去掉多余符号
		logger.Fatal("服务启动失败", zap.Error(err))

	}
}
