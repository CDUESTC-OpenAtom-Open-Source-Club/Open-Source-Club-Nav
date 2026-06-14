// scheduler/link_health_scheduler.go
package scheduler

import (
	"context"
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/utils"
	"os"
	"strconv"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// getHealthCheckInterval 从环境变量读取检测间隔（分钟），默认15分钟
func getHealthCheckInterval() time.Duration {
	val := os.Getenv("LINK_HEALTH_CHECK_INTERVAL")
	if val == "" {
		return 15 * time.Minute
	}
	minutes, err := strconv.Atoi(val)
	if err != nil || minutes < 1 {
		return 15 * time.Minute
	}
	return time.Duration(minutes) * time.Minute
}

// StartLinkHealthScheduler 启动链接健康检测定时任务
func StartLinkHealthScheduler(ctx context.Context, db *gorm.DB) {
	interval := getHealthCheckInterval()
	ticker := time.NewTicker(interval)

	utils.Logger.Info("链接健康检测定时任务启动",
		zap.Duration("interval", interval),
	)

	go func() {
		// 启动后立即执行一次
		runScheduledHealthCheck(db)

		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				utils.Logger.Info("链接健康检测定时任务停止")
				return
			case <-ticker.C:
				runScheduledHealthCheck(db)
			}
		}
	}()
}

// runScheduledHealthCheck 执行定时健康检测（静默模式，无SSE）
func runScheduledHealthCheck(db *gorm.DB) {
	start := time.Now()
	utils.Logger.Info("开始执行链接健康检测")

	// 调用 handler 内部的检测函数（不使用 SSE）
	checked, failed, skipped, total := handler.RunLinkHealthCheckInternal(db, false)

	duration := time.Since(start)
	utils.Logger.Info("链接健康检测完成",
		zap.Int("checked", checked),
		zap.Int("failed", failed),
		zap.Int("skipped", skipped),
		zap.Int("total", total),
		zap.Duration("duration", duration),
	)
}