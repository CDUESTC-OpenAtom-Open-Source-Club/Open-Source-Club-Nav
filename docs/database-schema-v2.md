# 数据库总设计文档 v2

本文档是当前项目数据库的最终执行版设计说明。

目标：

1. 基于当前业务逻辑重新定义数据库结构
2. 在保持既有业务表优先复用的前提下规范命名
3. 明确最终正式表、辅助表、种子数据与迁移方向

关联文档：

- 接口文档：[backend-api.md](/Users/blackevil/OpenAtom-Club-Nav-main/docs/backend-api.md)
- 旧版表设计：[database-schema.md](/Users/blackevil/OpenAtom-Club-Nav-main/docs/database-schema.md)
- 资源矩阵前后端数据契约：[resource-matrix-data-contract.md](resource-matrix-data-contract.md)

## 1. 最终执行原则

1. `users`、`nav_items`、`misc` 是既有业务表，优先复用。
2. 不再因为接口名简单重复造主业务表。
3. 审计、统计、健康检查、迁移版本表允许独立存在。
4. 所有正式结构统一纳入迁移体系。

## 2. 最终正式表清单

### 2.1 既有业务主表

- `users`
- `nav_items`
- `misc`

### 2.2 基础设施表

- `schema_migrations`

### 2.3 辅助能力表

- `login_audit`
- `nav_item_logs`
- `nav_item_health`
- `daily_stats`
- `daily_visits`
- `metrics`
- `works`

## 3. 表设计

### 3.1 `users`

用途：

- 统一用户主表
- 当前同时承担后台管理员账号能力

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | 用户 ID |
| `email` | `VARCHAR(100)` | 非空，默认空串 | 邮箱 |
| `password_hash` | `VARCHAR(255)` | 非空 | 密码哈希 |
| `role` | `VARCHAR(32)` | 非空，默认 `user` | `user` / `editor` / `super` |
| `status` | `TINYINT(1)` | 非空，默认 `1` | 是否启用 |
| `last_login_at` | `DATETIME` | 可空 | 最后登录时间 |
| `last_login_ip` | `VARCHAR(45)` | 可空 | 最后登录 IP |
| `created_by` | `BIGINT UNSIGNED` | 可空 | 创建人 |
| `password_changed_at` | `DATETIME` | 可空 | 密码更新时间 |
| `created_at` | `DATETIME(3)` | 可空 | 创建时间 |
| `updated_at` | `DATETIME(3)` | 可空 | 更新时间 |
| `deleted_at` | `DATETIME(3)` | 可空 | 软删除时间 |
| `username` | `VARCHAR(100)` | 非空，唯一 | 用户名 |
| `password` | `VARCHAR(255)` | 非空，默认空串 | 历史兼容字段 |

索引：

- `PRIMARY KEY (id)`
- `UNIQUE KEY idx_users_username (username)`
- `KEY idx_users_role (role)`
- `KEY idx_users_status (status)`

备注：

- 当前后台登录、后台用户管理直接复用此表
- 不再单独保留 `admin_users`

### 3.2 `nav_items`

用途：

- 统一导航项/友链主表
- 当前同时承接前台链接与后台链接管理

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `title` | `VARCHAR(120)` | 非空 | 标题 |
| `content` | `TEXT` | 非空 | 长内容 |
| `cover_url` | `VARCHAR(500)` | 非空，默认空串 | 封面图 |
| `link_url` | `VARCHAR(500)` | 非空，默认空串 | 跳转地址 |
| `description` | `VARCHAR(500)` | 非空，默认空串 | 短描述 |
| `sort` | `INT` | 非空，默认 `0` | 排序 |
| `active` | `TINYINT(1)` | 非空，默认 `1` | 是否启用 |
| `category` | `VARCHAR(64)` | 可空 | 分类 |
| `icon_url` | `VARCHAR(500)` | 可空 | 图标 |
| `created_by` | `BIGINT UNSIGNED` | 可空 | 创建人 |
| `updated_by` | `BIGINT UNSIGNED` | 可空 | 更新人 |
| `created_at` | `DATETIME(3)` | 可空 | 创建时间 |
| `updated_at` | `DATETIME(3)` | 可空 | 更新时间 |

索引：

- `PRIMARY KEY (id)`
- `KEY idx_nav_items_title (title)`
- `KEY idx_nav_items_active_sort (active, sort, id)`

备注：

- 当前后台的 `/api/admin/links` 与前台 `/api/links` 都应统一走此表
- 不再单独保留 `friend_links`
- `resource_matrix` 内容的源头是前端 `frontend/apps/web/src/data/resources.ts`，后端 `nav_items` 种子必须按 [资源矩阵前后端数据契约](resource-matrix-data-contract.md) 同步

### 3.3 `misc`

用途：

- 低频杂项扩展表
- 仅承载非核心结构化配置

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `other` | `JSON` | 可空 | 杂项 JSON |

### 3.4 `schema_migrations`

用途：

- 正式迁移版本控制

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `version` | `VARCHAR(64)` | 主键 | 迁移版本 |
| `name` | `VARCHAR(255)` | 非空 | 文件名 |
| `checksum` | `CHAR(64)` | 非空 | 内容校验 |
| `applied_at` | `DATETIME(3)` | 非空 | 执行时间 |

### 3.5 `login_audit`

用途：

- 登录失败限流
- 登录安全审计

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `username` | `VARCHAR(64)` | 非空 | 登录用户名 |
| `remote_addr` | `VARCHAR(45)` | 非空 | IP |
| `user_agent` | `VARCHAR(255)` | 非空 | UA |
| `success` | `TINYINT(1)` | 非空 | 是否成功 |
| `reason` | `VARCHAR(64)` | 非空 | 失败原因 |
| `created_at` | `DATETIME` | 非空 | 记录时间 |

索引：

- `idx_login_audit_identity_time (username, remote_addr, created_at)`
- `idx_login_audit_created_at (created_at)`

### 3.6 `nav_item_logs`

用途：

- 导航项/友链后台操作日志

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `nav_item_id` | `BIGINT UNSIGNED` | 可空 | 对应导航项 |
| `action` | `VARCHAR(32)` | 非空 | 行为 |
| `actor_user_id` | `BIGINT UNSIGNED` | 非空 | 操作人 |
| `actor_username` | `VARCHAR(64)` | 非空 | 用户名快照 |
| `actor_role` | `VARCHAR(32)` | 非空 | 角色快照 |
| `detail` | `JSON` | 可空 | 详情 |
| `created_at` | `DATETIME` | 非空 | 操作时间 |

索引：

- `idx_nav_item_logs_item_time (nav_item_id, created_at)`
- `idx_nav_item_logs_actor_time (actor_user_id, created_at)`

### 3.7 `nav_item_health`

用途：

- 导航项链接最新健康检查结果
- 与 `nav_items` 保持 1:1 运行态关系，不承载链接标题、排序、模块等业务主数据
- 健康检测页只展示 `is_ok = 0` 的异常记录，内容管理页读取全量结果显示单条链接状态

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | 健康记录 ID |
| `link_id` | `BIGINT UNSIGNED` | 非空 | 对应 `nav_items.id` |
| `title` | `VARCHAR(120)` | 可空 | 检测时的标题快照 |
| `status_code` | `INT` | 可空 | HTTP 状态码 |
| `is_ok` | `TINYINT(1)` | 非空 | 是否成功 |
| `message` | `VARCHAR(500)` | 可空 | 错误信息或状态说明 |
| `checked_at` | `DATETIME` | 非空 | 最近检查时间 |

索引：

- `idx_nav_item_health_link_id (link_id)`
- `idx_nav_item_health_ok_time (is_ok, checked_at)`

运行规则：

- 定期检测逐个扫描 `nav_items.active = 1` 且 `link_url` 非空、不是 `#` 的链接
- 检测结果 upsert 到 `nav_item_health`
- `nav_items` 保持业务内容稳定，不写入健康状态字段

### 3.8 `daily_stats`

用途：

- 每日聚合统计

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `stat_date` | `DATE` | 主键 | 日期 |
| `page_views` | `INT` | 非空 | PV |
| `unique_visitors` | `INT` | 非空 | UV |
| `link_clicks` | `INT` | 非空 | 点击数 |
| `updated_at` | `DATETIME` | 非空 | 更新时间 |

### 3.9 `daily_visits`

用途：

- 访客去重

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `stat_date` | `DATE` | 非空 | 日期 |
| `visitor_id` | `VARCHAR(64)` | 非空 | 访客 ID |
| `created_at` | `DATETIME` | 非空 | 记录时间 |

索引：

- `UNIQUE KEY uk_daily_visits_stat_visitor (stat_date, visitor_id)`
- `KEY idx_daily_visits_stat_date (stat_date)`

### 3.10 `metrics`

用途：

- 明细级访问/点击事件
- 支撑热门导航项统计

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `event_type` | `VARCHAR(16)` | 非空 | `visit` / `click` |
| `nav_item_id` | `BIGINT UNSIGNED` | 可空 | 被点击导航项 |
| `visitor_id` | `VARCHAR(64)` | 可空 | 访客 ID |
| `page_path` | `VARCHAR(255)` | 可空 | 页面路径 |
| `referrer` | `VARCHAR(500)` | 可空 | 来源 |
| `user_agent` | `VARCHAR(255)` | 可空 | UA |
| `ip_hash` | `CHAR(64)` | 可空 | IP 哈希 |
| `created_at` | `DATETIME` | 非空 | 时间 |

索引：

- `idx_metrics_event_time (event_type, created_at)`
- `idx_metrics_item_time (nav_item_id, created_at)`
- `idx_metrics_visitor_time (visitor_id, created_at)`

### 3.11 `works`

用途：

- 独立作品表
- 当前代码已经明确使用独立作品模型

字段：

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 主键 | |
| `type` | `VARCHAR(16)` | 非空 | `MANUAL` / `GITHUB` |
| `repo_url` | `VARCHAR(500)` | 可空，唯一 | 仓库链接 |
| `title` | `VARCHAR(160)` | 非空 | 标题 |
| `description` | `TEXT` | 非空 | 描述 |
| `author_name` | `VARCHAR(120)` | 非空 | 作者 |
| `author_avatar` | `VARCHAR(500)` | 可空 | 头像 |
| `tags` | `JSON` | 非空 | 标签 |
| `color` | `VARCHAR(16)` | 非空 | 主题色 |
| `status` | `VARCHAR(32)` | 非空 | 状态 |
| `stars` | `INT` | 非空 | Star 数 |
| `preview_url` | `VARCHAR(500)` | 可空 | 预览地址 |
| `is_featured` | `TINYINT(1)` | 非空 | 是否精选 |
| `display_order` | `INT` | 非空 | 排序 |
| `last_synced_at` | `DATETIME` | 可空 | 最近同步时间 |
| `created_at` | `DATETIME` | 非空 | 创建时间 |
| `updated_at` | `DATETIME` | 非空 | 更新时间 |

索引：

- `UNIQUE KEY uk_works_repo_url (repo_url)`
- `KEY idx_works_featured_order (is_featured, display_order, id)`
- `KEY idx_works_type (type)`
- `KEY idx_works_stars (stars)`

## 4. 种子数据策略

本项目只生成“基础可运行种子”，不生成运行中自然增长的数据。

应生成：

- `users` 的默认超级管理员
- `nav_items` 的基础导航种子

不应预置：

- 登录审计
- 操作日志
- 健康检查结果
- 访问埋点
- 每日统计

这些数据属于运行时自然产生的数据，只有发生真实操作才会出现。

## 5. 最终命名结论

### 保留并扩展

- `users`
- `nav_items`
- `misc`

### 最终辅助表名称

- `login_audit`
- `nav_item_logs`
- `nav_item_health`
- `daily_stats`
- `daily_visits`
- `metrics`
- `works`

### 不再作为最终正式表名保留

- `admin_users`
- `friend_links`
- `admin_daily_stats`
- `admin_daily_visits`
- `admin_link_logs`
- `admin_link_health`
- `admin_login_audit`

这些名字仅是前期实现中的临时命名，最终执行统一以上述正式表名为准。
