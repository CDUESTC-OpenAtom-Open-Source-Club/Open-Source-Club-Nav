// main.go
package main

import (
	"context"
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/db/migrate"
	_ "open-source-club-nav/backend/docs"
	"open-source-club-nav/backend/router"
	"open-source-club-nav/backend/utils"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func main() {
	// 初始化配置
	cfg := config.LoadConfig()

	// 初始化日志
	utils.InitLogger()
	defer utils.SyncLogger()

	// 初始化数据库（SQLite，嵌入式文件）
	dbPath := cfg.DBPath()
	if dir := filepath.Dir(dbPath); dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			utils.Logger.Fatal("创建数据库目录失败", zap.String("dir", dir), zap.Error(err))
		}
	}
	// DSN 中追加常用 PRAGMA：WAL 提高并发读写，外键约束，busy_timeout 抗短期锁等待
	dsn := dbPath + "?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=synchronous(NORMAL)"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		utils.Logger.Fatal("数据库连接失败", zap.String("path", dbPath), zap.Error(err))
	}
	utils.Logger.Info("数据库已连接 (SQLite)", zap.String("path", dbPath))
	if err := migrate.Run(context.Background(), db); err != nil {
		utils.Logger.Fatal("数据库迁移失败", zap.Error(err))
	}

	// 初始化路由
	r := router.InitRouter(db)

	// 启动服务
	utils.Logger.Info("服务启动成功，监听端口: 8080")
	if err := r.Run(":8080"); err != nil {
		utils.Logger.Fatal("服务启动失败", zap.Error(err))
	}
}
