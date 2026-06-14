# 链接健康检测优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现后端定时自动检测、并发检测（上限5）、重试机制（2次）、手动触发时SSE进度条

**Architecture:** 后端新增 scheduler 包实现定时任务；改造 CheckLinkHealth 支持并发+重试+SSE；前端接收SSE渲染进度条

**Tech Stack:** Go (time.Ticker, goroutine, channel), SSE (text/event-stream), React (useState, fetch ReadableStream)

---

## 文件结构

| 文件 | 责任 |
|------|------|
| `backend/scheduler/link_health_scheduler.go` | 定时任务启动器，time.Ticker 触发检测 |
| `backend/handler/admin_handler.go` | 改造 CheckLinkHealth：并发、重试、SSE stream |
| `backend/main.go` | 启动 scheduler goroutine，优雅关闭 |
| `backend/router/router.go` | 无需改动（handler 内部判断 stream 参数） |
| `frontend/apps/web/src/app/(admin)/admin/page.tsx` | SSE接收、进度条UI |

---

### Task 1: 创建 scheduler 包

**Files:**
- Create: `backend/scheduler/link_health_scheduler.go`

- [ ] **Step 1: 创建 scheduler 目录和文件**

```bash
mkdir -p backend/scheduler
touch backend/scheduler/link_health_scheduler.go
```

- [ ] **Step 2: 编写 link_health_scheduler.go**

```go
// scheduler/link_health_scheduler.go
package scheduler

import (
	"context"
	"fmt"
	"net/http"
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
```

- [ ] **Step 3: 验证文件语法**

```bash
cd backend && go build ./scheduler/...
```

Expected: 无错误输出

- [ ] **Step 4: Commit**

```bash
git add backend/scheduler/link_health_scheduler.go
git commit -m "feat: add link health scheduler with time.Ticker"
```

---

### Task 2: 改造 admin_handler.go - 添加并发检测+重试+内部函数

**Files:**
- Modify: `backend/handler/admin_handler.go:512-579` (CheckLinkHealth 函数区域)

- [ ] **Step 1: 在 admin_handler.go 添加重试函数 probeLinkWithRetry**

在 `probeLink` 函数（约 line 708）之后添加：

```go
// probeLinkWithRetry 带重试的链接探测，maxRetries=2 表示最多重试2次（共3次尝试）
func probeLinkWithRetry(client *http.Client, targetURL string, maxRetries int) (bool, *int, string) {
	var lastStatusCode *int
	var lastMessage string

	for attempt := 0; attempt <= maxRetries; attempt++ {
		isOK, statusCode, message := probeLink(client, targetURL)
		if isOK {
			return true, statusCode, "OK"
		}
		lastStatusCode = statusCode
		lastMessage = message
	}

	return false, lastStatusCode, lastMessage
}
```

- [ ] **Step 2: 添加并发检测核心函数 RunLinkHealthCheckInternal**

在 `CheckLinkHealth` 函数之前添加（约 line 510 位置）：

```go
// RunLinkHealthCheckInternal 执行链接健康检测核心逻辑（可被定时任务和HTTP handler调用）
// useStream=true 时返回 SSE stream 数据（由 handler 调用）
// useStream=false 时静默执行（由定时任务调用），返回统计数据
func RunLinkHealthCheckInternal(db *gorm.DB, useStream bool, streamWriter ...func(string)) (checked, failed, skipped, total int) {
	// 获取所有活跃的 nav_items
	type NavItemBasic struct {
		ID    uint
		Title string
		URL   string
	}
	var items []NavItemBasic
	db.Raw(`
SELECT id, title, link_url AS url
FROM nav_items
WHERE active = 1
  AND content_type IN ('resource_matrix', 'friend_links', 'mini_games')
  AND TRIM(link_url) != ''
  AND TRIM(link_url) != '#'
ORDER BY id ASC
`).Scan(&items)

	total = len(items)
	if total == 0 {
		return 0, 0, 0, 0
	}

	linkColumn := healthLinkColumn(db)
	healthCacheTTL := envDuration("LINK_HEALTH_CACHE_TTL", 24*time.Hour)
	cleanupStaleLinkHealth(db, linkColumn)
	healthColumns := map[string]bool{
		"title":            healthTableHasColumn(db, "title"),
		"url":              healthTableHasColumn(db, "url"),
		"response_time_ms": healthTableHasColumn(db, "response_time_ms"),
	}

	// 并发控制：semaphore 限制并发上限为5
	sem := make(chan struct{}, 5)
	results := make(chan linkHealthInternalResult, total)

	// 统计计数器
	checkedCount := 0
	failedCount := 0
	skippedCount := 0

	client := &http.Client{Timeout: 5 * time.Second}

	// 并发检测
	for _, item := range items {
		if item.URL == "" {
			continue
		}
		if healthCacheTTL > 0 && hasRecentLinkHealth(db, linkColumn, item.ID, healthCacheTTL) {
			skippedCount++
			continue
		}

		sem <- struct{}{} // 获取并发槽位
		go func(item NavItemBasic) {
			defer func() { <-sem }() // 释放槽位

			start := time.Now()
			isOK, statusCode, message := probeLinkWithRetry(client, item.URL, 2)
			responseTimeMs := int(time.Since(start).Milliseconds())

			now := time.Now()
			if err := upsertLinkHealth(db, linkColumn, healthColumns, item.ID, item.Title, item.URL, statusCode, isOK, message, responseTimeMs, now); err != nil {
				utils.Logger.Warn("写入链接健康状态失败", zap.Uint("link_id", item.ID), zap.Error(err))
			}

			results <- linkHealthInternalResult{
				linkID:        item.ID,
				title:         item.Title,
				url:           item.URL,
				isOK:          isOK,
				statusCode:    statusCode,
				message:       message,
				responseTimeMs: responseTimeMs,
			}
		}(item)
	}

	// 收集结果并推送进度（如果使用 SSE）
	for i := 0; i < total; i++ {
		r := <-results
		checkedCount++
		if !r.isOK {
			failedCount++
		}

		if useStream && len(streamWriter) > 0 {
			progressData := fmt.Sprintf(`{"checked":%d,"total":%d,"failed":%d,"current_title":"%s","current_url":"%s"}`,
				checkedCount, total, failedCount, r.title, r.url)
			streamWriter[0](progressData)
		}
	}

	checked = checkedCount
	failed = failedCount
	skipped = skippedCount
	return checked, failed, skipped, total
}

// linkHealthInternalResult 内部检测结果结构
type linkHealthInternalResult struct {
	linkID        uint
	title         string
	url           string
	isOK          bool
	statusCode    *int
	message       string
	responseTimeMs int
}
```

- [ ] **Step 3: 改造 CheckLinkHealth 函数支持 SSE**

替换原有的 CheckLinkHealth 函数（约 line 512-579）：

```go
// CheckLinkHealth 触发链接健康检查（POST /api/admin/link-health）
// 支持 ?stream=1 参数返回 SSE stream
func CheckLinkHealth(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// 判断是否使用 SSE stream
	useStream := c.Query("stream") == "1"

	if useStream {
		// SSE 模式：返回实时进度
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("Access-Control-Allow-Origin", "*")

		// SSE 写入函数
		streamWriter := func(data string) {
			c.Writer.WriteString(fmt.Sprintf("event: progress\ndata: %s\n\n", data))
			c.Writer.Flush()
		}

		// 执行检测
		checked, failed, skipped, total := RunLinkHealthCheckInternal(db, true, streamWriter)

		// 发送完成事件
		completeData := fmt.Sprintf(`{"checked":%d,"total":%d,"failed":%d,"skipped":%d}`,
			checked, total, failed, skipped)
		c.Writer.WriteString(fmt.Sprintf("event: complete\ndata: %s\n\n", completeData))
		c.Writer.Flush()

		// 记录日志
		detailBytes, _ := json.Marshal(gin.H{
			"checked": checked,
			"failed":  failed,
			"skipped": skipped,
			"total":   total,
			"reason":  "manual_probe_stream",
		})
		logAction(db, c, "check_health", nil, string(detailBytes))
	} else {
		// 传统 JSON 模式
		checked, failed, skipped, total := RunLinkHealthCheckInternal(db, false)

		detailBytes, _ := json.Marshal(gin.H{
			"checked": checked,
			"failed":  failed,
			"skipped": skipped,
			"total":   total,
			"reason":  "manual_probe",
		})
		logAction(db, c, "check_health", nil, string(detailBytes))

		c.JSON(http.StatusOK, gin.H{"checked": checked, "failed": failed, "skipped": skipped, "total": total})
	}
}
```

- [ ] **Step 4: 确保 fmt 包已导入**

在 admin_handler.go 的 import 块确认有 `"fmt"`：

```go
import (
	"bufio"
	"encoding/json"
	"fmt"  // 确保存在
	"net/http"
	...
)
```

- [ ] **Step 5: 验证编译**

```bash
cd backend && go build ./handler/...
```

Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add backend/handler/admin_handler.go
git commit -m "feat: add concurrent detection with retry and SSE support"
```

---

### Task 3: 改造 main.go - 启动 scheduler + 优雅关闭

**Files:**
- Modify: `backend/main.go`

- [ ] **Step 1: 添加 scheduler 包导入**

修改 main.go import 块：

```go
import (
	"context"
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/db/migrate"
	_ "open-source-club-nav/backend/docs"
	"open-source-club-nav/backend/router"
	"open-source-club-nav/backend/scheduler"  // 新增
	"open-source-club-nav/backend/utils"

	migrateLib "github.com/golang-migrate/migrate/v4"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)
```

- [ ] **Step 2: 启动 scheduler goroutine**

修改 main.go 函数体，在 `r := router.InitRouter(db, cfg)` 之前添加：

```go
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
```

- [ ] **Step 3: 验证编译**

```bash
cd backend && go build .
```

Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add backend/main.go
git commit -m "feat: start link health scheduler in main.go with graceful shutdown"
```

---

### Task 4: 前端 - 添加 HealthProgress state 和 SSE 接收函数

**Files:**
- Modify: `frontend/apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: 添加 HealthProgress 类型定义**

在 `type LinkHealth` 定义（约 line 67-78）之后添加：

```tsx
type HealthProgress = {
  checked: number;
  total: number;
  failed: number;
  skipped?: number;
  current_title?: string;
  current_url?: string;
} | null;
```

- [ ] **Step 2: 添加 healthProgress state**

在现有的 state 定义区域（约 line 320），添加：

```tsx
const [healthProgress, setHealthProgress] = useState<HealthProgress>(null);
```

- [ ] **Step 3: 改造 runHealthCheck 函数为 SSE 版本**

替换原有的 `runHealthCheck` 函数（约 line 1001-1019）：

```tsx
const runHealthCheck = async () => {
  if (healthChecking) return;
  setHealthChecking(true);
  setHealthProgress({ checked: 0, total: 0, failed: 0 });

  try {
    const res = await fetch("/api/admin/link-health?stream=1", { method: "POST" });
    if (!res.ok) {
      const data = await readJsonSafe<{ error?: string }>(res);
      throw new Error(data?.error || "检测失败");
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr) as HealthProgress;
            if (data) {
              setHealthProgress(data);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    await loadHealth();
    const nowIso = new Date().toISOString();
    setLastAutoDetectAt(nowIso);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_DETECT_LAST_RUN_KEY, nowIso);
    }
  } catch (err) {
    setError(String((err as Error).message || "检测失败"));
  } finally {
    setHealthChecking(false);
    // 检测完成后短暂延迟再隐藏进度条（让用户看到100%状态）
    setTimeout(() => setHealthProgress(null), 500);
  }
};
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
cd frontend/apps/web && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: 无类型错误

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/web/src/app/\(admin\)/admin/page.tsx
git commit -m "feat: add SSE progress receiver for health check"
```

---

### Task 5: 前端 - 添加进度条 UI 组件

**Files:**
- Modify: `frontend/apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: 在健康检测页面添加进度条 UI**

在 `activeSection === "health"` 区域内（约 line 1869），找到"监控对象状态面板"部分，修改布局：

找到约 line 1896-1917 的区域（监控对象状态面板），替换为：

```tsx
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: "10px 12px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
    {/* 进度条看板 - 仅手动触发时显示 */}
    {healthProgress && healthProgress.total > 0 && (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 280,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 4, height: 8 }}>
            <div style={{
              width: `${Math.min(100, (healthProgress.checked / healthProgress.total) * 100)}%`,
              height: 8,
              borderRadius: "4px 0 0 4px",
              background: "linear-gradient(90deg, #93C5FD, #2563EB)",
              transition: "width 0.15s ease",
            }} />
            <div style={{
              flex: 1,
              height: 8,
              borderRadius: "0 4px 4px 0",
              background: "#E2E8F0",
            }} />
          </div>
          <div style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
            {Math.round((healthProgress.checked / healthProgress.total) * 100)}%
            · {healthProgress.checked}/{healthProgress.total}
            {healthProgress.failed > 0 && <span style={{ color: "#DC2626", marginLeft: 4 }}>异常 {healthProgress.failed}</span>}
          </div>
        </div>
      </div>
    )}
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>监控对象状态面板</div>
      <div style={{ fontSize: 12, color: "#64748B" }}>
        {autoDetectEnabled
          ? `自动检测已开启：每 ${autoDetectIntervalMinutes} 分钟执行一次${lastAutoDetectAt ? `，最近一次 ${lastAutoDetectAt.replace("T", " ").slice(0, 19)}` : ""}`
          : "自动检测未开启"}
      </div>
    </div>
  </div>
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <button
      type="button"
      onClick={openAutoDetectDialog}
      className="admin-btn-ghost"
      style={{ height: 34, padding: "0 14px", borderRadius: 8, borderColor: autoDetectEnabled ? "#86EFAC" : "#CBD5E1", color: autoDetectEnabled ? "#166534" : "#334155" }}
    >
      自动检测
    </button>
    <button type="button" onClick={runHealthCheck} className="admin-btn" style={{ height: 34, padding: "0 14px", borderRadius: 8 }} disabled={healthChecking}>
      {healthChecking ? "探测中..." : "全量探测"}
    </button>
  </div>
</div>
```

- [ ] **Step 2: 验证页面渲染**

```bash
cd frontend/apps/web && npm run build 2>&1 | tail -20
```

Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/web/src/app/\(admin\)/admin/page.tsx
git commit -m "feat: add health check progress bar UI in admin page"
```

---

### Task 6: 整体测试验证

- [ ] **Step 1: 启动后端服务**

```bash
cd backend && go run . &
```

Expected: 日志显示 "链接健康检测定时任务启动" 和 "开始执行链接健康检测"

- [ ] **Step 2: 启动前端**

```bash
cd frontend/apps/web && npm run dev &
```

- [ ] **Step 3: 手动测试 SSE 进度条**

1. 打开浏览器访问 `http://localhost:4000/admin`
2. 登录后进入"健康检测"页面
3. 点击"全量探测"按钮
4. 观察进度条实时更新

Expected: 进度条显示百分比、已检测/总数、异常数

- [ ] **Step 4: 验证定时任务日志**

等待15分钟或修改环境变量缩短间隔：

```bash
LINK_HEALTH_CHECK_INTERVAL=1 go run .
```

Expected: 每分钟日志输出 "链接健康检测完成"

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete link health optimization - scheduled task, concurrent detection, retry, SSE progress bar"
```

---

## Self-Review 检查

**1. Spec 覆盖检查:**
- ✅ 定时任务 → Task 1, 3
- ✅ 并发检测（上限5） → Task 2
- ✅ 重试机制（2次） → Task 2
- ✅ SSE 进度推送 → Task 2, 4
- ✅ 前端进度条 → Task 5

**2. Placeholder 扫描:**
- 无 "TBD", "TODO", "implement later"
- 无空代码块

**3. 类型一致性:**
- `HealthProgress` 类型在前端定义，SSE 数据格式匹配
- `linkHealthInternalResult` 与 handler 内部使用一致