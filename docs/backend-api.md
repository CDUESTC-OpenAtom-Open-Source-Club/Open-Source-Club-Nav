# 统一接口文档

本文档是当前项目唯一权威接口文档。

以后前后端联调、接口新增、字段调整、鉴权约定，统一以本文件为准，不再分别维护其他独立 API 文档。

## 1. 当前统一原则

- 权威文档位置：`docs/backend-api.md`
- 前端实际消费接口：优先以 `fronted/apps/web/src/app/api/*` 为准
- Go `backend/` 目录下接口：当前视为遗留/补充接口，未接入前端主流程前，不作为默认联调口径
- 新接口上线前，必须先更新本文档

## 2. 当前服务结构

本地开发默认端口：

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| Next.js 前端 + BFF 接口 | `4000` | 当前前端页面实际调用的主接口层 |
| Go 后端 | `8080` | 遗留接口与后续可承接的独立后端服务 |
| MySQL | `3306` | 数据库 |

## 3. 鉴权口径

### 3.1 当前主口径

后台管理页面当前主鉴权链路是 Next BFF：

- 登录接口：`POST /api/admin/login`
- 会话载体：`httpOnly Cookie`
- 会话校验：`GET /api/admin/me`

### 3.2 当前开发模式注意事项

如果前端环境变量 `ADMIN_BYPASS_LOGIN !== "false"`，则后台会话会被开发绕过。

这意味着：

- 本地开发时可能不登录也能进入后台
- 服务器部署时必须显式关闭 bypass

建议生产环境固定：

```env
ADMIN_BYPASS_LOGIN=false
```

### 3.3 Go 后端遗留鉴权

Go 后端当前仍保留 JWT 头鉴权：

- 登录接口：`POST /login`
- 受保护接口：如 `GET /backend/admin/list`
- 请求头格式：`Authorization: <token>`

这套口径目前没有和前端后台主流程统一，暂不作为默认实现标准。

## 4. 统一响应约定

当前项目还没有完全统一响应包结构，但新增接口建议尽量遵循：

### 成功响应

```json
{
  "ok": true,
  "data": {}
}
```

或在兼容历史接口时返回业务字段：

```json
{
  "links": []
}
```

### 失败响应

```json
{
  "error": "错误描述"
}
```

## 5. 当前主接口清单

以下是当前前端实际在用、应优先维护的接口。

### 5.1 后台鉴权与会话

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | 否 | 后台登录，校验用户名密码并写入 Cookie |
| `POST` | `/api/admin/logout` | 否 | 清理后台 Cookie 会话 |
| `GET` | `/api/admin/me` | Cookie | 获取当前后台登录用户 |

#### POST `/api/admin/login`

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

成功响应：

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super"
  }
}
```

失败响应：

- `400`：用户名或密码为空
- `401`：账号或密码错误
- `500`：服务端异常

#### GET `/api/admin/me`

成功响应：

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super"
  }
}
```

失败响应：

```json
{
  "error": "未登录"
}
```

### 5.2 后台链接管理

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/admin/links` | `editor/super` | 获取后台链接列表 |
| `POST` | `/api/admin/links` | `editor/super` | 新增链接 |
| `PUT` | `/api/admin/links` | `editor/super` | 更新链接 |
| `DELETE` | `/api/admin/links?id={id}` | `editor/super` | 删除/禁用链接 |

#### GET `/api/admin/links`

成功响应：

```json
{
  "links": []
}
```

#### POST `/api/admin/links`

请求体：

```json
{
  "title": "GitHub",
  "url": "https://github.com",
  "description": "代码托管平台",
  "sort": 1
}
```

成功响应：

```json
{
  "ok": true,
  "link": {
    "id": 1,
    "title": "GitHub",
    "url": "https://github.com",
    "description": "代码托管平台",
    "sort": 1,
    "active": 1
  }
}
```

失败响应：

- `400`：缺少必要字段
- `401`：未登录
- `403`：无权限
- `500`：新增失败

### 5.3 后台用户管理

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users` | `super` | 获取后台用户列表 |
| `POST` | `/api/admin/users` | `super` | 新增后台用户 |

#### GET `/api/admin/users`

成功响应：

```json
{
  "users": []
}
```

#### POST `/api/admin/users`

请求体：

```json
{
  "username": "editor01",
  "password": "123456",
  "role": "editor"
}
```

成功响应：

```json
{
  "user": {
    "id": 2,
    "username": "editor01",
    "role": "editor",
    "created_at": "2026-05-26T00:00:00.000Z",
    "last_login_at": null
  }
}
```

失败响应：

- `400`：用户名/密码为空或密码长度不足
- `401`：未登录
- `403`：非 `super`
- `409`：用户名已存在

### 5.4 后台统计与系统信息

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/admin/stats` | Cookie | 后台统计概览 |
| `GET` | `/api/admin/system` | Cookie | 系统运行信息 |
| `GET` | `/api/admin/link-health` | Cookie | 获取链接健康检查结果 |
| `POST` | `/api/admin/link-health` | Cookie | 触发链接健康检查 |

#### POST `/api/admin/logout`

成功响应：

```json
{
  "ok": true
}
```

#### GET `/api/admin/stats`

说明：

- 当前用于后台首页概览卡片、趋势图、热门链接等数据展示
- 返回体来自 `getAdminStats()`
- 调用方应兼容后续字段扩展

成功响应示例：

```json
{
  "overview": {
    "pageViews": 1560,
    "uniqueVisitors": 432,
    "linkClicks": 318
  },
  "trend7": [
    {
      "stat_date": "2026-05-24",
      "link_clicks": 161
    }
  ],
  "popular": [
    {
      "category": "https://github.com/openatom",
      "clicks": 112
    }
  ]
}
```

失败响应：

- `401`：未登录

#### GET `/api/admin/system`

说明：

- 返回当前 Node 进程所在机器的系统信息
- 用于后台系统状态面板

成功响应示例：

```json
{
  "uptimeSec": 12345,
  "node": "v22.0.0",
  "platform": "darwin 25.0.0",
  "cpuCores": 8,
  "mem": {
    "total": 17179869184,
    "free": 4294967296,
    "used": 12884901888,
    "usageRate": 75.0
  },
  "loadavg": [1.25, 1.18, 1.02]
}
```

失败响应：

- `401`：未登录

#### GET `/api/admin/link-health`

成功响应：

```json
{
  "health": [
    {
      "link_id": 1,
      "url": "https://github.com",
      "status_code": 200,
      "is_ok": 1,
      "checked_at": "2026-05-26T00:00:00.000Z",
      "message": "",
      "title": "GitHub"
    }
  ]
}
```

失败响应：

- `401`：未登录

#### POST `/api/admin/link-health`

说明：

- 对当前启用中的友链发起 `HEAD` 检查
- 非 mock 模式下会写入 `admin_link_health`

成功响应示例：

```json
{
  "ok": true,
  "checked": 12
}
```

或 mock 模式：

```json
{
  "ok": true,
  "checked": 12,
  "health": []
}
```

失败响应：

- `401`：未登录

### 5.5 前台数据接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/activities` | 获取 GitHub 动态 |
| `GET` | `/api/org-stats` | 获取组织统计 |
| `GET` | `/api/works` | 获取作品列表 |
| `POST` | `/api/works` | 新增作品 |
| `PATCH` | `/api/works/{id}` | 更新单个作品 |
| `POST` | `/api/works/sync` | 同步 GitHub 类型作品 |
| `GET` | `/api/links` | 获取前台链接 |
| `POST` | `/api/links` | 新增友链 |
| `PUT` | `/api/links` | 更新友链 |
| `DELETE` | `/api/links?id={id}` | 删除友链 |
| `POST` | `/api/metrics/visit` | 访问埋点 |
| `POST` | `/api/metrics/click` | 点击埋点 |

#### GET `/api/activities`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `limit` | `number` | 否 | 返回数量上限，默认 `20` |

成功响应：

```json
{
  "activities": [],
  "source": "github"
}
```

#### GET `/api/org-stats`

成功响应：

```json
{
  "members": 42,
  "projects": 18,
  "stars": 1200,
  "source": "github"
}
```

#### GET `/api/works`

成功响应：

```json
{
  "works": [],
  "source": "github"
}
```

#### POST `/api/works`

请求体最少字段：

```json
{
  "title": "OpenAtom-Club-Nav",
  "author_name": "CDUESTC-OpenAtom-Open-Source-Club"
}
```

失败响应：

- `400`：缺少 `title` 或 `author_name`
- `503`：数据库未配置或新增失败

#### PATCH `/api/works/{id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `number` | 是 | 作品 ID |

允许更新字段：

- `type`
- `repo_url`
- `title`
- `description`
- `author_name`
- `author_avatar`
- `tags`
- `color`
- `status`
- `stars`
- `preview_url`
- `is_featured`
- `display_order`

成功响应：

```json
{
  "work": {
    "id": 1,
    "title": "OpenAtom-Club-Nav"
  }
}
```

失败响应：

- `400`：无更新字段
- `404`：作品不存在
- `503`：数据库未配置或更新失败

#### POST `/api/works/sync`

说明：

- 仅同步 `type='GITHUB'` 且存在 `repo_url` 的作品
- 会从 GitHub API 拉取仓库描述和 star 数

成功响应：

```json
{
  "synced": 3,
  "total": 5,
  "errors": []
}
```

如果没有可同步作品：

```json
{
  "message": "没有需要同步的 GITHUB 类型作品",
  "synced": 0
}
```

失败响应：

- `503`：数据库未配置或同步失败

#### GET `/api/links`

成功响应：

```json
{
  "links": [],
  "source": "mysql"
}
```

#### POST `/api/links`

鉴权：

- 需要后台已登录
- 需要 `editor` 或 `super`

请求体：

```json
{
  "title": "Cooo Wiki",
  "url": "https://wiki.cooo.site/links",
  "description": "友情链接",
  "sort": 1
}
```

成功响应：

```json
{
  "link": {
    "id": 1,
    "title": "Cooo Wiki",
    "url": "https://wiki.cooo.site/links",
    "description": "友情链接",
    "sort": 1,
    "active": 1
  }
}
```

失败响应：

- `400`：缺少 `title` 或 `url`
- `401`：未登录
- `403`：无权限
- `503`：数据库未配置，无法新增友链

#### PUT `/api/links`

请求体至少需要：

```json
{
  "id": 1
}
```

成功响应：

```json
{
  "link": {
    "id": 1
  }
}
```

失败响应：

- `400`：缺少 `id`
- `401`：未登录
- `403`：无权限
- `404`：友链不存在
- `503`：数据库未配置，无法更新友链

#### DELETE `/api/links?id={id}`

成功响应：

```json
{
  "success": true
}
```

失败响应：

- `400`：缺少 `id`
- `401`：未登录
- `403`：无权限
- `503`：数据库未配置，无法删除友链

#### POST `/api/metrics/visit`

说明：

- 记录访问埋点
- 首次访问会写入 `kcos_vid` Cookie
- 即使记录失败，也返回 `200`

成功响应：

```json
{
  "ok": true,
  "newVisitor": true
}
```

失败降级响应：

```json
{
  "ok": false
}
```

#### POST `/api/metrics/click`

说明：

- 记录首页或资源点击埋点
- 即使记录失败，也返回 `200`

成功响应：

```json
{
  "ok": true
}
```

失败降级响应：

```json
{
  "ok": false
}
```

## 6. 遗留 Go 后端接口

以下接口当前存在于 `backend/`，但不是前端主页面默认调用口径：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/register` | 用户注册 |
| `POST` | `/login` | JWT 登录 |
| `GET` | `/nav/search` | 搜索导航项 |
| `GET` | `/backend/admin/list` | 管理员列表 |
| `GET` | `/swagger/*any` | Swagger UI |

规则：

- 这些接口保留现状说明，但后续如需继续演进，必须先明确是否要并入主接口体系
- 未完成统一前，不要让前端新增功能直接依赖这组遗留接口

## 7. 开发要求

从现在开始统一执行以下规则：

1. 新增接口前，先在 `docs/backend-api.md` 增加条目。
2. 修改请求体、响应字段、鉴权规则前，先更新 `docs/backend-api.md`。
3. `fronted/apps/web/docs/API.md` 和 `fronted/apps/web/src/app/api/README.md` 不再承载独立接口定义，只保留入口说明。
4. 如果后续把 Next BFF 接口迁到 Go 后端，迁移后的唯一文档位置仍然是 `docs/backend-api.md`。
