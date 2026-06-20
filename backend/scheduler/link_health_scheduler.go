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

// shouldRunOnStart 从环境变量读取是否启动时立即执行检测，默认 true
// 在数据库重置期间可设置为 false，避免运行时表被污染
func shouldRunOnStart() bool {
	val := os.Getenv("LINK_HEALTH_RUN_ON_START")
	if val == "" {
		return true // 默认启动时执行
	}
	// "false", "0", "no" 表示不执行
	return val != "false" && val != "0" && val != "no"
}

// StartLinkHealthScheduler 启动链接健康检测定时任务
func StartLinkHealthScheduler(ctx context.Context, db *gorm.DB) {
	interval := getHealthCheckInterval()
	runOnStart := shouldRunOnStart()
	ticker := time.NewTicker(interval)

	utils.Logger.Info("链接健康检测定时任务启动",
		zap.Duration("interval", interval),
		zap.Bool("run_on_start", runOnStart),
	)

	go func() {
		// 启动后根据配置决定是否立即执行一次
		if runOnStart {
			runScheduledHealthCheck(db)
		}

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
	checked, failed, skipped, total := handler.RunLinkHealthCheckInternal(db, false, false)

	duration := time.Since(start)
	utils.Logger.Info("链接健康检测完成",
		zap.Int("checked", checked),
		zap.Int("failed", failed),
		zap.Int("skipped", skipped),
		zap.Int("total", total),
		zap.Duration("duration", duration),
	)
}
