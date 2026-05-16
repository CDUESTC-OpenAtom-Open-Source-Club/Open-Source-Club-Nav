// main.go
package main

import (
    "Open-Source-Club-Nav/backend/config"
    "Open-Source-Club-Nav/backend/router"
    "Open-Source-Club-Nav/backend/utils"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    // 1. 初始化配置
    cfg := config.LoadConfig()

    // 2. 初始化日志
    utils.InitLogger()
    defer utils.SyncLogger()

    // 3. 初始化数据库
    db, err := gorm.Open(mysql.Open(cfg.DB.DSN), &gorm.Config{})
    if err != nil {
        utils.Logger.Fatal("数据库连接失败", zap.Error(err))
    }

    // 4. 初始化路由
    r := router.InitRouter(db)

    // 5. 启动服务
    utils.Logger.Info("服务启动成功，监听端口: " + cfg.Server.Addr)
    if err := r.Run(cfg.Server.Addr); err != nil {
        utils.Logger.Fatal("服务启动失败", zap.Error(err))
    }
}
