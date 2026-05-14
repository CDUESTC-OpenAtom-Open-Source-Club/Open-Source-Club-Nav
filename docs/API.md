# API 文档

默认开发地址：`http://localhost:4000`

## 接口分层

项目接口分为两组：
- 前台接口：服务首页、资源页、作品区和埋点统计
- 后台接口：服务后台管理页面与权限控制

## 返回约定

大多数接口使用：
- 成功：`Response.json({...})`
- 失败：`Response.json({ error: string }, { status })`

如果一个接口支持多种数据源，通常会返回：
- `source: mock | github | mysql | fallback`

## 数据源切换

`.env.local`

```env
USE_MOCK_DATA=true
```

说明：
- `true`：优先走 mock 数据
- `false`：按接口实现走 GitHub API / MySQL

---

## 前台接口

### GET `/api/activities`
获取成员动态。

返回字段：
- `activities`
- `source`

数据来源：
- GitHub
- mock

### GET `/api/org-stats`
获取组织统计信息。

常见用途：
- 首页组织数据展示
- 贡献规模展示

### GET `/api/works`
获取作品列表。

返回字段：
- `works`
- `source`

数据来源优先级：
1. GitHub
2. MySQL
3. fallback 静态数据

### POST `/api/works`
新增作品。

说明：
- 支持 `MANUAL` 和 `GITHUB` 两种类型
- `GITHUB` 类型可通过 `repo_url` 自动补全部分字段

### PATCH `/api/works/[id]`
更新单个作品。

适合修改：
- 标题
- 描述
- 展示顺序
- 是否精选

### POST `/api/works/sync`
同步 GitHub 类型作品信息。

适合在以下场景使用：
- 仓库描述变更后手动刷新
- 星标数需要重新同步

### GET `/api/links`
获取前台友情链接列表。

返回字段：
- `links`
- `source`

### POST `/api/links`
新增友情链接。

权限：
- 需要后台登录
- `editor` 或 `super` 可操作

### PUT `/api/links`
更新友情链接。

支持字段：
- `title`
- `url`
- `description`
- `sort`
- `active`

### DELETE `/api/links?id=xxx`
软删除友情链接。

说明：
- 实际是将 `active` 改为 `0`
- 不直接删除数据库记录

### POST `/api/metrics/visit`
记录访问统计。

常见用途：
- 首页访问量统计
- 后台概览数据来源之一

### POST `/api/metrics/click`
记录点击统计。

常见用途：
- 链接点击统计
- 热门分类排行

---

## 后台接口

### GET `/api/admin/me`
获取当前后台登录用户。

返回字段：
- `ok`
- `user`

用途：
- 后台初始化时校验登录态

### POST `/api/admin/login`
后台登录。

说明：
- 登录成功后写入后台会话 Cookie
- 后续后台接口通过 Cookie 判断身份

### POST `/api/admin/logout`
后台退出登录。

说明：
- 清空后台会话 Cookie

### GET `/api/admin/links`
获取后台友链列表。

用途：
- 后台内容管理表格展示

### POST `/api/admin/links`
新增后台友链。

### PUT `/api/admin/links`
更新后台友链。

### DELETE `/api/admin/links?id=xxx`
禁用/删除后台友链。

说明：
- 这里同样是软删除思路

### GET `/api/admin/stats`
获取后台统计概览。

常见返回字段：
- `today`
- `days`
- `trend7`
- `popularCategories`

用途：
- 今日客流量
- 七日趋势图
- 热门分类卡片

### GET `/api/admin/system`
获取服务运行信息。

常见返回字段：
- `uptimeSec`
- `node`
- `platform`
- `cpuCores`
- `mem`
- `loadavg`

### GET `/api/admin/logs`
获取后台操作日志。

用途：
- 排查内容变更
- 查看后台操作记录

### GET `/api/admin/link-health`
获取链接健康检测结果。

### POST `/api/admin/link-health`
触发一次链接健康检测。

适合场景：
- 批量检查友情链接是否可访问
- 后台手动刷新健康状态

### GET `/api/admin/users`
获取后台用户列表。

权限：
- 仅 `super`

### POST `/api/admin/users`
创建后台用户。

权限：
- 仅 `super`

---

## 权限说明

后台角色：
- `super`：拥有全部权限
- `editor`：可管理内容，但不能管理后台用户

典型受限接口：
- `/api/admin/users`

## 联调建议

### 做前端联调时
- 先看接口是否支持 mock
- 尽量不要直接依赖数据库是否可用
- 改字段时同时检查 fallback 数据结构

### 做后台联调时
- 先确认 `/api/admin/me` 是否正常
- 写操作完成后，前端一般会重新请求列表
- 如果出现 401，优先检查登录态与 Cookie
