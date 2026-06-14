---
name: 链接健康检测优化设计
description: 定时自动检测、并发检测、重试机制、手动触发进度条
type: project
---

# 链接健康检测优化设计

## 背景

当前健康检测存在以下问题：
1. 没有服务端定时自动检测（仅有前端浏览器端轮询）
2. 检测是串行的，50个链接最坏情况需250秒
3. 无重试机制，临时网络波动导致误报
4. 手动触发时无进度可视化

## 设计目标

- 后端定时任务自动检测（不依赖浏览器会话）
- 并发检测提升速度，限制并发上限避免网络压力
- 重试机制减少误报
- 手动触发时显示进度条，自动检测静默执行

## 核心参数

| 参数 | 值 |
|------|-----|
| 并发上限 | 5 |
| HTTP 超时 | 5秒 |
| 重试次数 | 2次（共3次尝试） |
| 定时检测间隔 | 默认15分钟，环境变量 `LINK_HEALTH_CHECK_INTERVAL` 可配置 |

---

## Section 1: 后端定时任务

### 实现方式

- 后端启动时创建后台 goroutine，用 `time.Ticker` 定时触发检测
- 检测间隔通过环境变量 `LINK_HEALTH_CHECK_INTERVAL` 配置（单位分钟，默认15）
- 服务关闭时通过 `context.Context` 优雅停止 goroutine

### 新增文件

**`backend/scheduler/link_health_scheduler.go`**

```go
package scheduler

import (
    "context"
    "gorm.io/gorm"
    "time"
)

func StartLinkHealthScheduler(ctx context.Context, db *gorm.DB) {
    interval := getHealthCheckInterval() // 从环境变量读取，默认15分钟
    ticker := time.NewTicker(interval)
    go func() {
        for {
            select {
            case <-ctx.Done():
                ticker.Stop()
                return
            case <-ticker.C:
                runHealthCheck(db) // 执行检测
            }
        }
    }()
}
```

### main.go 改动

```go
ctx, cancel := context.WithCancel(context.Background())
scheduler.StartLinkHealthScheduler(ctx, db)
// 优雅关闭时调用 cancel()
```

### 特点

- 定时检测是后台静默执行，不推送进度到前端
- 检测结果写入 `nav_item_health` 表，前端下次刷新时能看到最新状态

---

## Section 2: 并发检测实现

### 并发控制

使用 semaphore（带缓冲 channel）限制并发上限为5：

```go
sem := make(chan struct{}, 5)  // 并发上限5
results := make(chan linkHealthResult, len(items))

for _, item := range items {
    sem <- struct{}{}  // 获取槽位
    go func(item NavItemBasic) {
        defer func() { <-sem }()  // 释放槽位

        start := time.Now()
        isOK, statusCode, message := probeLinkWithRetry(client, item.URL, 2)
        responseTimeMs := int(time.Since(start).Milliseconds())

        results <- linkHealthResult{
            item: item,
            isOK: isOK,
            statusCode: statusCode,
            message: message,
            responseTimeMs: responseTimeMs,
        }
    }(item)
}

// 收集所有结果并写入数据库
for i := 0; i < len(items); i++ {
    r := <-results
    upsertLinkHealth(db, linkColumn, healthColumns, r.item.ID, r.item.Title, r.item.URL,
        r.statusCode, r.isOK, r.message, r.responseTimeMs, time.Now())
}
```

### 重试机制

```go
func probeLinkWithRetry(client *http.Client, targetURL string, maxRetries int) (bool, *int, string) {
    var lastErr error
    var lastStatusCode *int
    var lastMessage string

    for attempt := 0; attempt <= maxRetries; attempt++ {
        isOK, statusCode, message := probeLink(client, targetURL)
        if isOK {
            return true, statusCode, "OK"
        }
        lastErr = err
        lastStatusCode = statusCode
        lastMessage = message
        // 立即重试，无等待
    }

    return false, lastStatusCode, lastMessage
}
```

**重试逻辑**：
- 尝试1 → 失败 → 尝试2 → 失败 → 尝试3 → 最终结果
- 3次全部失败才标记为失败

---

## Section 3: SSE 进度推送（手动触发）

### API 改动

- `POST /api/admin/link-health?stream=1` → 返回 SSE stream
- `POST /api/admin/link-health`（无 stream 参数）→ 返回传统 JSON（兼容定时任务）

### SSE 数据格式

```
event: progress
data: {"checked":5,"total":50,"failed":1,"current_title":"GitHub","current_url":"https://github.com"}

event: progress
data: {"checked":10,"total":50,"failed":2,...}

event: complete
data: {"checked":50,"total":50,"failed":3,"duration_ms":12500}
```

### 后端实现

```go
func CheckLinkHealthWithStream(c *gin.Context) {
    db := c.MustGet("db").(*gorm.DB)

    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control", "no-cache")
    c.Header("Connection", "keep-alive")

    items := getActiveNavItems(db)
    total := len(items)

    // 并发检测 + 实时推送进度
    sem := make(chan struct{}, 5)
    results := make(chan linkHealthResult, total)
    checked := 0
    failed := 0

    for _, item := range items {
        sem <- struct{}{}
        go func(item) {
            defer func() { <-sem }()
            // 检测逻辑...
            results <- result

            // 推送进度
            checked++
            if !result.isOK { failed++ }
            progress := fmt.Sprintf("event: progress\ndata: %s\n\n",
                jsonMarshal(map[string]interface{}{
                    "checked": checked,
                    "total": total,
                    "failed": failed,
                    "current_title": item.Title,
                    "current_url": item.URL,
                }))
            c.Writer.WriteString(progress)
            c.Writer.Flush()
        }(item)
    }

    // 收集完成后发送 complete
    for i := 0; i < total; i++ { <-results }
    complete := fmt.Sprintf("event: complete\ndata: %s\n\n",
        jsonMarshal(map[string]interface{}{
            "checked": total,
            "total": total,
            "failed": failed,
        }))
    c.Writer.WriteString(complete)
}
```

---

## Section 4: 前端进度条 UI

### 显示规则

- **自动检测**：不显示进度条，静默执行，完成后更新顶部统计卡片
- **手动全量探测**：显示进度条看板，完成后消失，顶部统计更新

### 状态新增

```tsx
type HealthProgress = {
  checked: number;
  total: number;
  failed: number;
  current_title?: string;
  current_url?: string;
} | null;

const [healthProgress, setHealthProgress] = useState<HealthProgress>(null);
```

### SSE 接收逻辑

```tsx
const runHealthCheckWithProgress = async () => {
  setHealthChecking(true);
  setHealthProgress({ checked: 0, total: 0, failed: 0 });

  try {
    const res = await fetch('/api/admin/link-health?stream=1', { method: 'POST' });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      // 解析 SSE event: progress / complete
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          setHealthProgress(data);
        }
      }
    }

    await loadHealth(); // 刷新健康数据
  } finally {
    setHealthChecking(false);
    setHealthProgress(null); // 检测完成后消失
  }
};
```

### UI 布局

```tsx
{/* 进度条看板 - 仅手动触发时显示 */}
{healthProgress && (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    border: '1px solid #E8EEF6',
    borderRadius: 10,
    padding: '10px 16px'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: `${(healthProgress.checked / healthProgress.total) * 100}%`,
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #93C5FD, #2563EB)'
        }} />
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: '#E2E8F0'
        }} />
      </div>
      <div style={{ fontSize: 12, color: '#475569' }}>
        {Math.round((healthProgress.checked / healthProgress.total) * 100)}%
        · 已检测 {healthProgress.checked}/{healthProgress.total}
        · 异常 {healthProgress.failed}
        {healthProgress.current_title && ` · 当前: ${healthProgress.current_title}`}
      </div>
    </div>
  </div>
)}
```

### 位置

在"监控对象状态面板"中，与按钮同行，位于按钮左侧：

```
┌─────────────────────────────────────────────────────────────┐
│  [进度条看板]                      │ [自动检测] [全量探测]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 文件改动清单

| 文件 | 改动 |
|------|------|
| `backend/scheduler/link_health_scheduler.go` | **新增** - 定时任务实现 |
| `backend/handler/admin_handler.go` | 改造 CheckLinkHealth 支持并发+重试+SSE |
| `backend/router/router.go` | 添加 SSE stream 路由参数支持 |
| `backend/main.go` | 启动定时任务 goroutine |
| `frontend/apps/web/src/app/(admin)/admin/page.tsx` | 新增进度条 UI + SSE 接收逻辑 |

---

## 测试要点

1. 定时任务：启动后端，观察日志是否每15分钟触发检测
2. 并发检测：添加大量链接，验证检测速度提升
3. 重试机制：模拟网络抖动，验证重试生效
4. SSE 进度：点击全量探测，观察进度条实时更新
5. 优雅关闭：Ctrl+C 后端，验证 goroutine 正常退出