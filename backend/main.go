// main.go
package main

import (
	"open-source-club-nav/backend/config"
	_ "open-source-club-nav/backend/docs"
	"open-source-club-nav/backend/router"
	"open-source-club-nav/backend/utils"

	"go.uber.org/zap" // 新增zap的导入
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 初始化配置
	cfg := config.LoadConfig()

	// 初始化日志
	utils.InitLogger()
	defer utils.SyncLogger()

	// 初始化数据库（用cfg.MySQL.DSN）
	db, err := gorm.Open(mysql.Open(cfg.MySQL.DSN), &gorm.Config{})
	if err != nil {
		utils.Logger.Fatal("数据库连接失败", zap.Error(err))
	}

	// 初始化路由
	r := router.InitRouter(db)

	// 启动服务（如果yaml里没有server，这里可以直接写端口，比如":8080"）
	// 启动服务
	utils.Logger.Info("服务启动成功，监听端口: 8080")
	if err := r.Run(":8080"); err != nil { // 补全err判断，去掉多余符号
		utils.Logger.Fatal("服务启动失败", zap.Error(err))
	}
}
