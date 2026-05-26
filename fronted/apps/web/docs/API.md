# API 文档

默认开发地址：`http://localhost:4000`

## 接口分层

项目接口分为两组：
- **前台接口**：服务首页、资源页、作品区和埋点统计
- **后台接口**：服务后台管理页面与权限控制

## 返回约定

所有接口统一使用 JSON 格式返回。

**成功响应：**
```json
{
  "字段名": "值",
  "source": "github | mock | mysql | fallback"
}
```

**失败响应：**
```json
{
  "error": "错误描述信息"
}
```

常见 HTTP 状态码：

| 状态码 | 含义 | 典型场景 |
|--------|------|----------|
| `200` | 成功 | GET 请求正常返回 |
| `201` | 已创建 | POST 新增资源成功 |
| `400` | 参数错误 | 缺少必填字段、格式不合法 |
| `401` | 未登录 | 后台接口未提供有效 Cookie |
| `403` | 无权限 | 角色权限不足（如 editor 访问 users） |
| `404` | 资源不存在 | 指定 ID 的记录未找到 |
| `503` | 服务不可用 | 数据库未配置或外部 API 不可用 |

## 数据源切换

`.env` 中设置：

```env
USE_MOCK_DATA=true
```

- `true`：优先走 mock 数据，适合本地开发和演示
- `false`：按接口实现走 GitHub API / MySQL，真实数据不可用时自动降级

大多数接口支持 `source` 字段标识当前数据来源：`mock` / `github` / `mysql` / `fallback`。

---

## 前台接口

### GET `/api/activities`

获取组织成员最近的 GitHub 动态事件。

**数据来源优先级：**
1. GitHub Events API（实时）
2. mock 静态数据（降级）

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `activities` | `Activity[]` | 动态列表，最多 20 条 |
| `source` | `string` | 数据来源：`github` / `mock` |

**Activity 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 事件唯一标识 |
| `type` | `string` | 事件类型，如 `PushEvent`、`PullRequestEvent` |
| `actor.login` | `string` | 操作者 GitHub 用户名 |
| `actor.avatar` | `string` | 头像缩写（2 字母） |
| `repo` | `string` | 仓库全名，如 `org/repo` |
| `message` | `string` | 事件摘要描述 |
| `branch` | `string \| null` | 关联分支名 |
| `commits` | `number \| null` | 提交数量（仅 PushEvent） |
| `time` | `string` | 相对时间，如 `2 分钟前` |
| `color` | `string` | 事件类型对应的主题色 |

**支持的事件类型：**

| type | 标签 | 主题色 |
|------|------|--------|
| `PushEvent` | PUSH | `#0A84FF` |
| `PullRequestEvent` | PR | `#06E5CC` |
| `CreateEvent` | INIT | `#7C3AED` |
| `IssuesEvent` | ISSUE | `#F59E0B` |
| `ReleaseEvent` | RELEASE | `#10B981` |
| `ForkEvent` | FORK | `#EC4899` |

**返回示例：**

```json
{
  "activities": [
    {
      "id": "42891367892",
      "type": "PushEvent",
      "actor": { "login": "zhang-wei", "avatar": "ZW" },
      "repo": "CDUESTC-OpenAtom-Open-Source-Club/course-assistant",
      "message": "feat: add conflict detection algorithm",
      "branch": "main",
      "commits": 3,
      "time": "2 分钟前",
      "color": "#0A84FF"
    }
  ],
  "source": "github"
}
```

---

### GET `/api/org-stats`

获取组织统计概览，用于首页展示社团规模。

**数据来源优先级：**
1. GitHub API（并行请求组织信息、成员列表、仓库列表）
2. mock 静态数据（降级）

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `members` | `number` | 公开成员数量 |
| `projects` | `number` | 公开仓库数量 |
| `stars` | `number` | 所有非 fork 仓库的 Star 总数 |
| `source` | `string` | 数据来源 |

**返回示例：**

```json
{
  "members": 42,
  "projects": 18,
  "stars": 1200,
  "source": "github"
}
```

---

### GET `/api/works`

获取作品列表。

**数据来源优先级：**
1. GitHub 组织仓库（排除 fork）
2. MySQL 数据库
3. 静态 fallback 数据

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `works` | `Work[]` | 作品列表 |
| `source` | `string` | 数据来源 |

**Work 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 作品 ID |
| `type` | `string` | 类型：`GITHUB` / `MANUAL` |
| `repo_url` | `string \| null` | GitHub 仓库地址 |
| `title` | `string` | 作品标题 |
| `description` | `string` | 作品描述 |
| `author_name` | `string` | 作者名称 |
| `author_avatar` | `string` | 作者头像缩写 |
| `tags` | `string[]` | 技术标签列表 |
| `color` | `string` | 展示主题色 |
| `status` | `string` | 状态：`已上线` / `开发中` / `内测中` / `已归档` |
| `stars` | `number` | Star 数量 |
| `preview_url` | `string \| null` | 预览链接 |
| `is_featured` | `number` | 是否精选：`1` / `0` |
| `display_order` | `number` | 展示排序权重 |

**返回示例：**

```json
{
  "works": [
    {
      "id": 1,
      "type": "GITHUB",
      "repo_url": "https://github.com/CDUESTC-OpenAtom-Open-Source-Club/OpenAtom-Club-Nav",
      "title": "OpenAtom-Club-Nav",
      "description": "科成开放原子开源社团导航站",
      "author_name": "CDUESTC-OpenAtom-Open-Source-Club",
      "author_avatar": "CD",
      "tags": ["TypeScript"],
      "color": "#0A84FF",
      "status": "开发中",
      "stars": 5,
      "preview_url": null,
      "is_featured": 1,
      "display_order": 1
    }
  ],
  "source": "github"
}
```

---

### POST `/api/works`

新增作品。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `string` | 否 | `MANUAL`（默认）或 `GITHUB` |
| `repo_url` | `string` | 否 | GitHub 仓库地址，`GITHUB` 类型时可自动补全 |
| `title` | `string` | **是** | 作品标题 |
| `description` | `string` | 否 | 作品描述 |
| `author_name` | `string` | **是** | 作者名称 |
| `author_avatar` | `string` | 否 | 头像缩写，默认取 author_name 前两字母 |
| `tags` | `string[]` | 否 | 技术标签 |
| `color` | `string` | 否 | 主题色，默认 `#0A84FF` |
| `status` | `string` | 否 | 状态，默认 `开发中` |
| `stars` | `number` | 否 | Star 数，`GITHUB` 类型可自动获取 |
| `preview_url` | `string` | 否 | 预览链接 |
| `is_featured` | `boolean` | 否 | 是否精选，默认 `true` |
| `display_order` | `number` | 否 | 排序权重，默认 `0` |

**GITHUB 类型自动补全：** 当 `type` 为 `GITHUB` 且提供 `repo_url` 时，接口会自动从 GitHub API 获取仓库描述、语言和 Star 数。

**请求示例：**

```json
{
  "type": "GITHUB",
  "repo_url": "https://github.com/org/repo",
  "title": "My Project",
  "author_name": "Developer"
}
```

**成功响应（201）：**

```json
{
  "work": {
    "id": 9,
    "type": "GITHUB",
    "repo_url": "https://github.com/org/repo",
    "title": "My Project",
    "description": "Auto-filled from GitHub",
    "author_name": "Developer",
    "author_avatar": "DE",
    "tags": ["TypeScript"],
    "color": "#0A84FF",
    "status": "开发中",
    "stars": 42,
    "preview_url": null,
    "is_featured": 1,
    "display_order": 0
  }
}
```

**错误响应：**

| 状态码 | 场景 | 响应 |
|--------|------|------|
| `400` | 缺少 title 或 author_name | `{ "error": "title 和 author_name 为必填项" }` |
| `503` | 数据库不可用 | `{ "error": "数据库未配置或新增失败" }` |

---

### PATCH `/api/works/[id]`

更新单个作品信息。

**路径参数：**
- `id` — 作品 ID

**可更新字段：** `title`、`description`、`tags`、`color`、`status`、`stars`、`preview_url`、`is_featured`、`display_order`

---

### POST `/api/works/sync`

同步 GitHub 类型作品的信息（重新从 GitHub API 拉取描述、Star 等）。

**适用场景：**
- 仓库描述变更后手动刷新
- Star 数需要重新同步

---

### GET `/api/links`

获取前台友情链接列表。

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `links` | `Link[]` | 友链列表 |
| `source` | `string` | 数据来源 |

**Link 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 友链 ID |
| `title` | `string` | 链接标题 |
| `url` | `string` | 链接地址 |
| `description` | `string` | 链接描述 |
| `sort` | `number` | 排序权重 |
| `active` | `number` | 是否启用：`1` / `0` |

**返回示例：**

```json
{
  "links": [
    {
      "id": 1,
      "title": "Cooo Wiki 友链页",
      "url": "https://wiki.cooo.site/links",
      "description": "Cooo Wiki 友情链接",
      "sort": 1,
      "active": 1
    }
  ],
  "source": "mysql"
}
```

---

### POST `/api/links`

新增友情链接。

**权限：** 需要后台登录，`editor` 或 `super` 角色。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | **是** | 链接标题 |
| `url` | `string` | **是** | 链接地址 |
| `description` | `string` | 否 | 链接描述 |
| `sort` | `number` | 否 | 排序权重，默认 `0` |

**错误响应：**

| 状态码 | 场景 | 响应 |
|--------|------|------|
| `400` | 缺少 title 或 url | `{ "error": "title 和 url 为必填项" }` |
| `401` | 未登录 | `{ "error": "未登录" }` |
| `403` | 权限不足 | `{ "error": "无权限" }` |
| `503` | 数据库不可用 | `{ "error": "数据库未配置，无法新增友链" }` |

---

### PUT `/api/links`

更新友情链接。

**权限：** 需要后台登录，`editor` 或 `super` 角色。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `number` | **是** | 友链 ID |
| `title` | `string` | 否 | 链接标题 |
| `url` | `string` | 否 | 链接地址 |
| `description` | `string` | 否 | 链接描述 |
| `sort` | `number` | 否 | 排序权重 |
| `active` | `boolean` | 否 | 是否启用 |

仅更新传入的字段，未传入的字段保持不变。

**错误响应：**

| 状态码 | 场景 | 响应 |
|--------|------|------|
| `400` | 缺少 id 或无可更新字段 | `{ "error": "id 为必填项" }` / `{ "error": "没有可更新字段" }` |
| `404` | 友链不存在 | `{ "error": "友链不存在" }` |

---

### DELETE `/api/links?id=xxx`

软删除友情链接（将 `active` 设为 `0`，不删除数据库记录）。

**查询参数：**
- `id` — 友链 ID（必填）

**成功响应：**

```json
{ "success": true }
```

**错误响应：**

| 状态码 | 场景 | 响应 |
|--------|------|------|
| `400` | 缺少 id | `{ "error": "id 为必填项" }` |
| `404` | 友链不存在 | `{ "error": "友链不存在" }` |

---

### POST `/api/metrics/visit`

记录一次页面访问统计。

**适用场景：**
- 首页访问量统计
- 后台概览数据来源之一

---

### POST `/api/metrics/click`

记录一次链接点击统计。

**适用场景：**
- 链接点击统计
- 热门分类排行

---

## 后台接口

### GET `/api/admin/me`

获取当前后台登录用户信息，用于初始化时校验登录态。

**返回示例：**

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

**未登录时：**

```json
{
  "ok": false,
  "user": null
}
```

---

### POST `/api/admin/login`

后台登录。成功后写入会话 Cookie，后续后台接口通过 Cookie 判断身份。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | `string` | **是** | 用户名 |
| `password` | `string` | **是** | 密码 |

**错误响应：**

| 状态码 | 场景 | 响应 |
|--------|------|------|
| `400` | 缺少用户名或密码 | `{ "error": "用户名和密码不能为空" }` |
| `401` | 账号密码错误 | `{ "error": "用户名或密码错误" }` |

---

### POST `/api/admin/logout`

退出后台登录，清空会话 Cookie。

**成功响应：**

```json
{ "ok": true }
```

---

### GET `/api/admin/links`

获取后台友链列表（包含已禁用的），用于后台内容管理表格。

---

### POST `/api/admin/links`

后台新增友链，逻辑同前台 `POST /api/links`。

---

### PUT `/api/admin/links`

后台更新友链，逻辑同前台 `PUT /api/links`。

---

### DELETE `/api/admin/links?id=xxx`

后台禁用/删除友链（软删除），逻辑同前台 `DELETE /api/links`。

---

### GET `/api/admin/stats`

获取后台统计概览数据。

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `today` | `object` | 今日访问数据 |
| `days` | `number` | 统计天数 |
| `trend7` | `array` | 近 7 天访问趋势 |
| `popularCategories` | `array` | 热门分类排行 |

**适用场景：**
- 今日客流量卡片
- 七日趋势折线图
- 热门分类排行

---

### GET `/api/admin/system`

获取服务器运行信息。

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `uptimeSec` | `number` | 服务运行时长（秒） |
| `node` | `string` | Node.js 版本 |
| `platform` | `string` | 操作系统平台 |
| `cpuCores` | `number` | CPU 核心数 |
| `mem` | `object` | 内存使用情况 |
| `loadavg` | `number[]` | 系统负载均值 |

---

### GET `/api/admin/logs`

获取后台操作日志记录。

**适用场景：**
- 排查内容变更历史
- 查看后台操作记录

---

### GET `/api/admin/link-health`

获取链接健康检测结果。

---

### POST `/api/admin/link-health`

触发一次批量链接健康检测。

**适用场景：**
- 批量检查友情链接是否可访问
- 后台手动刷新健康状态

---

### GET `/api/admin/users`

获取后台用户列表。

**权限：** 仅 `super` 角色可访问。

---

### POST `/api/admin/users`

创建后台用户。

**权限：** 仅 `super` 角色可操作。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | `string` | **是** | 用户名 |
| `password` | `string` | **是** | 密码 |
| `role` | `string` | 否 | 角色：`editor`（默认）/ `super` |

---

## 权限说明

后台角色体系：

| 角色 | 权限范围 |
|------|----------|
| `super` | 全部权限，包括用户管理 |
| `editor` | 内容管理（友链、作品等），不能管理后台用户 |

典型受限接口：
- `GET /api/admin/users` — 仅 `super`
- `POST /api/admin/users` — 仅 `super`

---

## 联调建议

### 前端联调

1. 先确认 `USE_MOCK_DATA` 环境变量设置
2. 优先用 mock 模式验证页面逻辑，不依赖数据库是否可用
3. 修改字段时同步检查 fallback 数据结构是否兼容
4. 关注返回的 `source` 字段，判断当前数据来源

### 后台联调

1. 先调用 `GET /api/admin/me` 确认登录态是否正常
2. 写操作完成后，前端应重新请求列表以刷新数据
3. 遇到 `401` 错误时，优先检查 Cookie 是否过期
4. 遇到 `403` 错误时，检查当前用户角色是否满足接口要求
