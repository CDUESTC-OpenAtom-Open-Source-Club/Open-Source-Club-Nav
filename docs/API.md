# KCOS 导航站 — 前端 API 接口文档

> 基础地址: `http://localhost:3000`（开发环境）

---

## 1. GitHub 成员动态

### `GET /api/activities`

获取社团 GitHub 组织的最近活动事件。

**请求参数**: 无

**返回格式**:
```json
{
  "activities": [
    {
      "id": "123456",
      "type": "PushEvent",
      "actor": {
        "login": "zhang-san",
        "avatar": "ZS"
      },
      "repo": "CDUESTC-OpenAtom-Open-Source-Club/project-name",
      "message": "feat: 新功能描述",
      "branch": "main",
      "commits": 3,
      "time": "2 分钟前",
      "color": "#0A84FF"
    }
  ],
  "source": "github"
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | string | 事件类型：`PushEvent` / `PullRequestEvent` / `CreateEvent` / `IssuesEvent` / `ReleaseEvent` / `ForkEvent` |
| `actor.login` | string | GitHub 用户名 |
| `actor.avatar` | string | 用户名首字母缩写，用于头像占位 |
| `repo` | string | 仓库全名（组织/仓库） |
| `message` | string | 事件描述 |
| `branch` | string \| null | 分支名，部分事件类型无分支 |
| `commits` | number \| null | 提交数量，仅 PushEvent 有值 |
| `time` | string | 相对时间，如 "2 分钟前" |
| `color` | string | 事件类型对应的展示色值 |
| `source` | string | 数据来源：`github` = 真实 API / `mock` = 降级数据 |

**事件类型 → 标签映射**:
| type | 展示标签 |
|---|---|
| PushEvent | PUSH |
| PullRequestEvent | PR |
| CreateEvent | INIT |
| IssuesEvent | ISSUE |
| ReleaseEvent | RELEASE |
| ForkEvent | FORK |

**降级机制**: GitHub API 不可用时自动返回本地 mock 数据，`source` 字段为 `"mock"`。

---

## 2. 友情链接

### `GET /api/links`

获取所有有效友链。

**请求参数**: 无

**返回格式**:
```json
{
  "links": [
    {
      "id": 1,
      "title": "Cooo Wiki 友链页",
      "url": "https://wiki.cooo.site/links",
      "description": "Cooo Wiki 友情链接",
      "sort": 1,
      "active": 1,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/links`

新增友链。

**请求体**:
```json
{
  "title": "链接标题（必填）",
  "url": "https://example.com（必填）",
  "description": "链接描述（选填）",
  "sort": 3
}
```

**返回**: `201` + 新建的友链对象

---

### `PUT /api/links`

更新友链。

**请求体**:
```json
{
  "id": 1,
  "title": "新标题",
  "url": "https://new-url.com",
  "description": "新描述",
  "sort": 5,
  "active": true
}
```

所有字段除 `id` 外均为选填，只传需要修改的字段。

**返回**: 更新后的友链对象

---

### `DELETE /api/links?id=1`

删除友链（软删除，仅标记为不启用）。

**请求参数**: `id` (query string)

**返回**:
```json
{ "success": true }
```

---

## 3. 成员作品

### `GET /api/works`

获取首页展示的作品列表。

**请求参数**: 无

**返回格式**:
```json
{
  "works": [
    {
      "id": 1,
      "type": "MANUAL",
      "title": "选课助手 Pro",
      "description": "自动抢课 · 冲突检测 · 课表可视化",
      "author_name": "Zhang Wei",
      "author_avatar": "ZW",
      "tags": ["React", "Python", "FastAPI"],
      "color": "#0A84FF",
      "status": "已上线",
      "stars": 128,
      "preview_url": null,
      "is_featured": 1,
      "display_order": 1
    }
  ],
  "source": "mysql"
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | string | `GITHUB` = 自动同步 / `MANUAL` = 手动录入 |
| `repo_url` | string \| null | GitHub 仓库地址（仅 GITHUB 类型） |
| `tags` | string[] | 技术栈标签 |
| `status` | string | 状态：`已上线` / `开发中` / `内测中` 等 |
| `stars` | number | Star 数量（GITHUB 类型可自动更新） |
| `is_featured` | number | 是否在首页轮播展示：1 = 是，0 = 否 |

**降级机制**: MySQL 不可用时返回默认数据，`source` 为 `"fallback"`。

---

### `POST /api/works`

新增作品。

**请求体 (手动类型)**:
```json
{
  "type": "MANUAL",
  "title": "内网穿透工具",
  "author_name": "张三",
  "tags": ["Rust"],
  "color": "#FF5500",
  "status": "公测中"
}
```

**请求体 (GitHub 类型)**:
```json
{
  "type": "GITHUB",
  "repo_url": "https://github.com/OpenAtom-Club/Nav",
  "author_name": "张三",
  "is_featured": true
}
```
后端自动从 GitHub API 获取 `title`、`description`、`stars`、`tags`。

**返回**: `201` + 新建的作品对象

---

### `PATCH /api/works/:id`

更新单个作品。

**请求体**: 只传需要修改的字段
```json
{
  "status": "已上线",
  "stars": 200,
  "is_featured": true
}
```

---

### `POST /api/works/sync`

手动触发同步所有 GITHUB 类型作品的 `stars` 和 `description`。

**返回**:
```json
{
  "synced": 3,
  "total": 5,
  "errors": []
}
```

---

## 前端调用示例

```typescript
// 获取动态
const res = await fetch("/api/activities");
const { activities, source } = await res.json();

// 获取友链
const res = await fetch("/api/links");
const { links } = await res.json();

// 新增友链
await fetch("/api/links", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "新链接", url: "https://example.com" }),
});

// 获取作品列表
const res = await fetch("/api/works");
const { works, source } = await res.json();

// 新增 GitHub 类型作品（自动获取仓库信息）
await fetch("/api/works", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "GITHUB",
    repo_url: "https://github.com/OpenAtom-Club/Nav",
    author_name: "张三",
  }),
});

// 更新作品状态
await fetch("/api/works/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "已上线", stars: 200 }),
});

// 触发 GitHub 数据同步
await fetch("/api/works/sync", { method: "POST" });
```
