# KCOS 导航站 — Mock 数据 & API 文档

本目录存放前端演示用的模拟数据，供后端开发参考接口规范。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `USE_MOCK_DATA` | 启用模拟数据模式 | `true` |
| `GITHUB_TOKEN` | GitHub API Token（可选） | `<github-token>` |
| `ADMIN_BYPASS_LOGIN` | 跳过管理员认证 | `false` |

---

## 公开接口（无需认证）

### GET /api/works
获取作品列表。优先读取 GitHub 组织仓库，其次 MySQL，最后回退到静态数据。

**响应：**
```json
[
  {
    "id": 1,
    "type": "MANUAL",
    "repo_url": null,
    "title": "选课助手 Pro",
    "description": "自动抢课 / 冲突检测 / 课表可视化",
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
]
```

### POST /api/works
新增作品。

**请求体：**
```json
{
  "title": "项目名称",
  "description": "项目描述",
  "author_name": "作者",
  "tags": ["React"],
  "color": "#0A84FF",
  "status": "开发中"
}
```

### PATCH /api/works/:id
更新指定作品。支持字段：`type`, `repo_url`, `title`, `description`, `author_name`, `author_avatar`, `tags`, `color`, `status`, `stars`, `preview_url`, `is_featured`, `display_order`

### POST /api/works/sync
手动触发同步所有 GITHUB 类型作品的 stars 和 description。

**响应：**
```json
{ "message": "同步完成", "synced": 5, "errors": [] }
```

---

### GET /api/links
获取友情链接列表。

**响应：**
```json
[
  {
    "id": 1,
    "title": "Cooo Wiki",
    "url": "https://wiki.cooo.site/links",
    "description": "Cooo Wiki 友情链接",
    "sort": 1,
    "active": 1
  }
]
```

---

### GET /api/activities
获取 GitHub 组织最近活动。

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | number | 20 | 返回数量（最大 100） |

**响应：**
```json
[
  {
    "id": "event-123",
    "type": "PushEvent",
    "actor": "username",
    "repo": "org/repo",
    "created_at": "2026-05-15T10:00:00Z",
    "payload": {}
  }
]
```

---

### GET /api/github-users
获取 GitHub 组织成员列表。

**响应：**
```json
[
  {
    "login": "username",
    "name": "Display Name",
    "avatarUrl": "https://avatars.githubusercontent.com/u/xxx",
    "htmlUrl": "https://github.com/username",
    "blog": "https://example.com"
  }
]
```

---

### GET /api/org-stats
获取组织统计数据。

**响应：**
```json
{
  "members": 42,
  "projects": 18,
  "stars": 1200,
  "source": "mock"
}
```

---

### POST /api/metrics/visit
记录页面访问（PV/UV）。自动通过 Cookie 去重。

**响应：**
```json
{ "ok": true, "newVisitor": false }
```

### POST /api/metrics/click
记录链接点击。

**响应：**
```json
{ "ok": true }
```

---

### GET /api/system
获取系统时间信息。

**响应：**
```json
{
  "now": "2026-05-15T10:00:00.000Z",
  "uptimeSec": 3600,
  "startedAt": "2026-05-15T09:00:00.000Z"
}
```

---

## 管理后台接口（需要认证）

认证方式：Cookie Session，通过 `/api/admin/login` 获取。

### POST /api/admin/login
管理员登录。

**请求体：**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应：**
```json
{
  "ok": true,
  "user": { "id": 1, "username": "admin", "role": "super" }
}
```

**错误：**
- `400` 用户名或密码为空
- `401` 用户名或密码错误

### POST /api/admin/logout
退出登录，清除 Session Cookie。

### GET /api/admin/me
获取当前登录用户信息。

**响应：**
```json
{
  "ok": true,
  "user": { "id": 1, "username": "admin", "role": "super" }
}
```

---

### GET /api/admin/users
获取所有管理员用户列表（仅 super 角色）。

**响应：**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "super",
      "created_at": "2026-01-01T00:00:00Z",
      "last_login_at": "2026-05-15T10:00:00Z"
    }
  ]
}
```

### POST /api/admin/users
创建管理员用户（仅 super 角色）。

**请求体：**
```json
{
  "username": "editor1",
  "password": "pass123456",
  "role": "editor"
}
```

---

### GET /api/admin/links
获取友情链接列表（含禁用项，需 editor+ 角色）。

### POST /api/admin/links
新增友情链接。

**请求体：**
```json
{
  "title": "链接标题",
  "url": "https://example.com",
  "description": "链接描述",
  "sort": 1,
  "active": 1
}
```

### PATCH /api/admin/links
更新友情链接。

**请求体：**
```json
{
  "id": 1,
  "title": "新标题",
  "active": 0
}
```

### DELETE /api/admin/links
删除友情链接。

**请求体：**
```json
{ "id": 1 }
```

---

### GET /api/admin/stats
获取后台统计数据。

**响应：**
```json
{
  "today": {
    "stat_date": "2026-05-15",
    "page_views": 1280,
    "unique_visitors": 426,
    "link_clicks": 318
  },
  "days": [...],
  "trend7": [...],
  "popularCategories": [
    { "category": "github.com", "clicks": 52 }
  ]
}
```

---

### GET /api/admin/logs
获取操作日志（最近 100 条）。

**响应：**
```json
{
  "logs": [
    {
      "id": 1,
      "link_id": 1,
      "action": "create",
      "actor_username": "admin",
      "actor_role": "super",
      "detail": {},
      "created_at": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

### GET /api/admin/system
获取服务器系统信息（需认证）。

**响应：**
```json
{
  "uptimeSec": 86400,
  "node": "v20.10.0",
  "platform": "linux 5.15.0",
  "cpuCores": 4,
  "mem": {
    "total": 8589934592,
    "free": 4294967296,
    "used": 4294967296,
    "usageRate": 50.0
  },
  "loadavg": [1.20, 0.80, 0.60]
}
```

---

### GET /api/admin/link-health
获取友链健康检测结果。

**响应：**
```json
{
  "health": [
    {
      "link_id": 1,
      "url": "https://openatom.cn",
      "status_code": 200,
      "is_ok": 1,
      "checked_at": "2026-05-15T10:00:00Z",
      "message": "",
      "title": "OpenAtom Docs"
    }
  ]
}
```

### POST /api/admin/link-health
触发友链健康检测。

**响应：**
```json
{ "ok": true, "checked": 5 }
```

---

## 数据库表结构（后端参考）

### friend_links — 友情链接
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| title | VARCHAR(100) | 链接标题 |
| url | VARCHAR(500) | 链接地址 |
| description | VARCHAR(255) | 链接描述 |
| sort | INT | 排序权重（越小越前） |
| active | TINYINT(1) | 是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### works — 成员作品
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| type | ENUM('GITHUB','MANUAL') | 数据来源 |
| repo_url | VARCHAR(500) | GitHub 仓库地址 |
| title | VARCHAR(200) | 项目名称 |
| description | TEXT | 项目简述 |
| author_name | VARCHAR(100) | 作者姓名 |
| author_avatar | VARCHAR(255) | 作者头像 |
| tags | JSON | 技术栈标签 |
| color | VARCHAR(20) | 主题色 |
| status | VARCHAR(50) | 状态 |
| stars | INT | Star 数量 |
| preview_url | VARCHAR(500) | 预览地址 |
| is_featured | TINYINT(1) | 是否首页展示 |
| display_order | INT | 排序权重 |

### admin_users — 管理员
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| username | VARCHAR(64) | 登录用户名 |
| password_hash | VARCHAR(255) | 密码哈希 |
| role | ENUM('super','editor') | 角色 |
| created_by | INT | 创建者 ID |
| last_login_at | DATETIME | 最后登录时间 |

### admin_daily_stats — 每日统计
| 字段 | 类型 | 说明 |
|------|------|------|
| stat_date | DATE | 统计日期（主键） |
| page_views | INT | PV |
| unique_visitors | INT | UV |
| link_clicks | INT | 链接点击数 |

### admin_daily_visits — 每日访客明细
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| stat_date | DATE | 统计日期 |
| visitor_id | VARCHAR(64) | 访客 ID |

### admin_link_logs — 链接操作日志
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| link_id | INT | 链接 ID |
| action | VARCHAR(20) | 操作类型 |
| actor_user_id | INT | 操作者 ID |
| actor_username | VARCHAR(64) | 操作者用户名 |
| actor_role | VARCHAR(20) | 操作者角色 |
| detail | JSON | 操作详情 |

### admin_link_health — 友链健康检测
| 字段 | 类型 | 说明 |
|------|------|------|
| link_id | INT | 链接 ID |
| url | VARCHAR(500) | 检测 URL |
| status_code | INT | HTTP 状态码 |
| is_ok | TINYINT(1) | 是否正常 |
| checked_at | DATETIME | 检测时间 |
| message | VARCHAR(255) | 检测信息 |
