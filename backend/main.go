// main.go
package main

import (
	"context"

	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/db/migrate"
	_ "open-source-club-nav/backend/docs"
	"open-source-club-nav/backend/router"
	"open-source-club-nav/backend/scheduler"
	"open-source-club-nav/backend/utils"

	migrateLib "github.com/golang-migrate/migrate/v4"
	"go.uber.org/zap" // 新增zap的导入
	"gorm.io/driver/mysql"

	"gorm.io/gorm"
)

func main() {
	cfg := config.GetConfig()
	logger := utils.InitLogger()
	defer utils.SyncLogger(logger)

	db, err := gorm.Open(mysql.Open(cfg.BuildDSN()), &gorm.Config{})
	if err != nil {
		logger.Fatal("数据库连接失败", zap.Error(err))
	}

	migrateDSN := "mysql://" + cfg.BuildDSN()
	if err := migrate.Run(migrateDSN); err != nil && err != migrateLib.ErrNoChange {
		logger.Fatal("数据库迁移失败", zap.Error(err))
	}

	if err := utils.InitRedis(cfg.Redis.Addr, cfg.Redis.Password, cfg.Redis.DB); err != nil {
		logger.Fatal("Redis 连接失败", zap.Error(err))
	}
	logger.Info("Redis 连接成功")

	// 启动链接健康检测定时任务
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	scheduler.StartLinkHealthScheduler(ctx, db)

	r := router.InitRouter(db, cfg)
	serverAddr := cfg.ServerAddr()
	logger.Info("服务启动成功", zap.String("addr", serverAddr))
	if err := r.Run(serverAddr); err != nil {
		logger.Fatal("服务启动失败", zap.Error(err))
	}
}
