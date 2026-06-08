# 统一接口文档

本文档以 `frontend/apps/web/src/app/api/*` 为主索引，整理当前 Web 前端实际暴露和消费的全部 API。

## 1. 统一原则

- 权威文档位置：`docs/backend-api.md`
- 前端实际消费接口：以 `frontend/apps/web/src/app/api/*` 为准
- Go `backend/` 目录下接口：仅作为 BFF 转发目标或遗留接口补充
- 新增、修改、下线接口前，先更新本文档

## 2. 当前服务结构

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| Next.js 前端 + BFF | `4000` | 浏览器与页面直接访问的接口层 |
| Go 后端 | `8080` | BFF 转发目标与后端业务实现 |
| MySQL | `3306` | 数据库 |

## 3. 鉴权口径

### 3.1 前端主鉴权链路

- 登录：`POST /api/admin/login`
- 会话：`httpOnly Cookie`
- 校验：`GET /api/admin/me`
- 登出：`POST /api/admin/logout`

### 3.2 开发模式注意事项

如果前端环境变量 `ADMIN_BYPASS_LOGIN !== "false"`，后台登录态可能被绕过。

建议生产环境固定：

```env
ADMIN_BYPASS_LOGIN=false
```

### 3.3 后端遗留鉴权

Go 后端仍保留一套 JWT 头鉴权：

- `POST /login`
- `GET /backend/admin/list`
- 请求头：`Authorization: <token>`

这套口径当前不作为前端主流程标准。

## 4. 状态说明

| 状态 | 含义 |
| --- | --- |
| `已实现` | 前端存在 BFF 路由文件，且可映射到后端接口 |
| `前端引用未落地` | 页面或文档中已引用，但 `src/app/api/*` 下没有对应路由文件 |

## 5. 前端 API 总表

以下“前端路径”均指浏览器访问的 Next BFF 路径。

### 5.1 后台鉴权与会话

| 方法 | 前端路径 | 后端目标 | 鉴权 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/admin/login` | `POST /api/admin/login` | 否 | `已实现` | 后台登录 |
| `GET` | `/api/admin/me` | `GET /api/admin/me` | Cookie | `已实现` | 获取当前登录用户，BFF 会做字段整形 |
| `POST` | `/api/admin/logout` | `POST /api/admin/logout` | Cookie | `已实现` | 清理后台会话 |

### 5.2 后台管理接口

| 方法 | 前端路径 | 后端目标 | 鉴权 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/admin/stats` | `GET /api/admin/stats` | Cookie | `已实现` | 后台统计概览 |
| `GET` | `/api/admin/system` | `GET /api/admin/system` | Cookie | `已实现` | 系统运行信息 |
| `GET` | `/api/admin/link-health` | `GET /api/admin/link-health?limit=` | Cookie | `已实现` | 获取链接健康检查结果 |
| `POST` | `/api/admin/link-health` | `POST /api/admin/link-health` | Cookie | `已实现` | 触发健康检查 |
| `GET` | `/api/admin/logs` | `GET /api/admin/logs` | Cookie | `已实现` | 获取后台操作日志 |
| `GET` | `/api/admin/login-audit` | `GET /api/admin/login-audit` | Cookie | `已实现` | 获取后台登录审计日志 |
| `GET` | `/api/admin/links` | `GET /api/links` | Cookie | `已实现` | 后台读取链接列表，BFF 走公共查询口 |
| `POST` | `/api/admin/links` | `POST /api/admin/links` | `editor/super` | `已实现` | 新增链接 |
| `PUT` | `/api/admin/links` | `PUT /api/admin/links/:id` | `editor/super` | `已实现` | 更新链接，`id` 从请求体读取 |
| `DELETE` | `/api/admin/links?id={id}` | `DELETE /api/admin/links/:id` | `editor/super` | `已实现` | 删除链接 |
| `GET` | `/api/admin/users` | `GET /api/admin/users` | `super` | `已实现` | 获取后台用户列表 |
| `POST` | `/api/admin/users` | `POST /api/admin/users` | `super` | `已实现` | 创建后台用户 |
| `DELETE` | `/api/admin/users?id={id}` | `DELETE /api/admin/users/:id` | `super` | `已实现` | 删除后台用户 |
| `GET` | `/api/admin/works` | `GET /api/admin/works` | Cookie | `已实现` | 获取全部作品 |
| `POST` | `/api/admin/works` | `POST /api/admin/works` | Cookie | `已实现` | 创建作品 |
| `POST` | `/api/admin/works/sync` | `POST /api/admin/works/sync` | Cookie | `已实现` | 同步 GitHub 作品信息 |
| `PATCH` | `/api/admin/works/{id}` | `PATCH /api/admin/works/:id` | Cookie | `已实现` | 更新作品 |
| `DELETE` | `/api/admin/works/{id}` | `DELETE /api/admin/works/:id` | Cookie | `已实现` | 删除作品 |
| `GET` | `/api/admin/content` | `GET /api/content` | Cookie | `已实现` | 获取内容列表 |
| `POST` | `/api/admin/content` | `POST /api/content` | `editor/super` | `已实现` | 创建内容 |
| `PUT` | `/api/admin/content/{id}` | `PUT /api/content/:id` | `editor/super` | `已实现` | 更新内容 |
| `DELETE` | `/api/admin/content/{id}` | `DELETE /api/content/:id` | `editor/super` | `已实现` | 删除内容 |
| `PUT` | `/api/admin/content/{id}/toggle` | `PUT /api/content/:id/toggle` | `editor/super` | `已实现` | 切换内容启用状态 |

### 5.3 首页公共接口

| 方法 | 前端路径 | 后端目标 | 鉴权 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/healthz` | `GET /api/healthz` | 否 | `已实现` | 健康检查 |
| `GET` | `/api/system` | `GET /api/system` | 否 | `已实现` | 前台系统信息 |
| `GET` | `/api/activities` | `GET /api/activities` | 否 | `已实现` | GitHub 动态 |
| `GET` | `/api/org-stats` | `GET /api/org-stats` | 否 | `已实现` | 组织统计 |
| `GET` | `/api/github-users` | `GET /api/github-users` | 否 | `已实现` | GitHub 用户信息聚合 |
| `GET` | `/api/github-contributors` | `GET /api/github-contributors` | 否 | `已实现` | 仓库贡献者信息 |
| `GET` | `/api/links` | `GET /api/links` | 否 | `已实现` | 查询前台链接，支持模块筛选 |
| `GET` | `/api/works` | `GET /api/works` | 否 | `已实现` | 获取公开作品列表 |
| `GET` | `/api/works/{id}` | `GET /api/works/:id` | 否 | `已实现` | 获取单个作品 |

### 5.4 首页埋点接口

| 方法 | 前端路径 | 后端目标 | 鉴权 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/metrics/visit` | `POST /api/metrics/visit` | 否 | `已实现` | 访问埋点 |
| `POST` | `/api/metrics/click` | `POST /api/metrics/click` | 否 | `已实现` | 点击埋点 |

### 5.5 前端已引用但未落地的接口

| 方法 | 前端路径 | 前端引用位置 | 状态 | 说明 |
| --- | --- | --- | --- | --- |
| 暂无 | - | - | - | 当前前端已引用的 Web BFF 接口均已落地 |

## 6. 前端 API 文件索引

### 6.1 公共 BFF 路由

| 路由文件 | 暴露路径 |
| --- | --- |
| `src/app/api/activities/route.ts` | `/api/activities` |
| `src/app/api/github-contributors/route.ts` | `/api/github-contributors` |
| `src/app/api/github-users/route.ts` | `/api/github-users` |
| `src/app/api/healthz/route.ts` | `/api/healthz` |
| `src/app/api/links/route.ts` | `/api/links` |
| `src/app/api/org-stats/route.ts` | `/api/org-stats` |
| `src/app/api/system/route.ts` | `/api/system` |
| `src/app/api/works/route.ts` | `/api/works` |
| `src/app/api/works/[id]/route.ts` | `/api/works/{id}` |
| `src/app/api/metrics/visit/route.ts` | `/api/metrics/visit` |
| `src/app/api/metrics/click/route.ts` | `/api/metrics/click` |

### 6.2 后台 BFF 路由

| 路由文件 | 暴露路径 |
| --- | --- |
| `src/app/api/admin/login/route.ts` | `/api/admin/login` |
| `src/app/api/admin/logout/route.ts` | `/api/admin/logout` |
| `src/app/api/admin/me/route.ts` | `/api/admin/me` |
| `src/app/api/admin/stats/route.ts` | `/api/admin/stats` |
| `src/app/api/admin/system/route.ts` | `/api/admin/system` |
| `src/app/api/admin/link-health/route.ts` | `/api/admin/link-health` |
| `src/app/api/admin/login-audit/route.ts` | `/api/admin/login-audit` |
| `src/app/api/admin/logs/route.ts` | `/api/admin/logs` |
| `src/app/api/admin/links/route.ts` | `/api/admin/links` |
| `src/app/api/admin/users/route.ts` | `/api/admin/users` |
| `src/app/api/admin/works/route.ts` | `/api/admin/works` |
| `src/app/api/admin/works/sync/route.ts` | `/api/admin/works/sync` |
| `src/app/api/admin/works/[id]/route.ts` | `/api/admin/works/{id}` |
| `src/app/api/admin/content/route.ts` | `/api/admin/content` |
| `src/app/api/admin/content/[id]/route.ts` | `/api/admin/content/{id}` |
| `src/app/api/admin/content/[id]/toggle/route.ts` | `/api/admin/content/{id}/toggle` |

## 7. 当前缺口与建议

1. 首页公共 API 统一保持只读，所有写操作统一收口到 `/api/admin/*`。
2. `frontend/apps/web/src/app/api/README.md` 只保留层级说明，不再单独维护接口定义。
3. 如果后续把 BFF 下沉到 Go 后端，仍以本文档作为唯一接口索引。

## 8. 后端遗留接口

以下接口当前存在于 `backend/`，但不属于前端 Web BFF 主索引：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/register` | 用户注册 |
| `POST` | `/login` | JWT 登录 |
| `GET` | `/nav/search` | 搜索导航项 |
| `GET` | `/backend/admin/list` | 管理员列表 |
| `GET` | `/swagger/*any` | Swagger UI |
| `GET` | `/api/resources` | 资源矩阵查询，当前未通过 Web BFF 单独暴露 |
| `GET` | `/api/games` | 小游戏查询，当前未通过 Web BFF 单独暴露 |
| `GET` | `/api/articles` | 文章查询，当前未通过 Web BFF 单独暴露 |
| `GET/POST/PUT/DELETE` | `/api/admin/articles` | 后端已实现，前端当前未接入 |
