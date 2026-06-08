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

	r := router.InitRouter(db, cfg)
	logger.Info("服务启动成功，监听端口: 8080")
	if err := r.Run(":8080"); err != nil {
		logger.Fatal("服务启动失败", zap.Error(err))
	}
}
