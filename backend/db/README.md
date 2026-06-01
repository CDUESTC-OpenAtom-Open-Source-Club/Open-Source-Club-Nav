# Database

后端使用应用内置 SQL 迁移引擎，服务启动时自动执行。

## 目录结构

```
backend/db/
├── migrate/
│   ├── migrator.go                    # 迁移引擎（嵌入 SQL、校验 checksum、按序执行）
│   └── migrations/
│       ├── 001_schema.sql             # 全量表结构定义（14 张表）
│       ├── 002_seed_accounts.sql      # 种子用户账号（admin / editor）
│       └── 003_seed_data.sql          # 全量业务种子数据
└── README.md
```

## 迁移文件说明

| 文件 | 职责 |
|------|------|
| `001_schema.sql` | 所有表的 `CREATE TABLE IF NOT EXISTS`，包含完整字段和索引 |
| `002_seed_accounts.sql` | 管理员和编辑账号（幂等 `ON DUPLICATE KEY UPDATE`） |
| `003_seed_data.sql` | 全量业务数据：导航、资源、游戏、文章、作品、统计 |

## 启动行为

服务启动后自动：

1. 连接 MySQL
2. 创建 `schema_migrations` 版本表
3. 按文件名顺序执行未应用的 SQL 迁移
4. 记录已执行版本和 SHA-256 checksum

已执行的迁移不会重复执行；文件内容被改动会导致 checksum 不一致，服务拒绝启动。

## 数据库表（14 张）

| 表名 | 说明 |
|------|------|
| `users` | 用户/管理员（role: super / editor / user） |
| `nav_items` | 导航内容（资源矩阵 / 友情链接 / 小游戏） |
| `resource_matrix` | 资源矩阵（智库 / 校园 / 工具） |
| `mini_games` | 小游戏 |
| `articles` | 文章 |
| `works` | 社团作品 / GitHub 仓库 |
| `daily_stats` | 每日统计 |
| `daily_visits` | 每日访客明细 |
| `metrics` | 事件指标（访问 / 点击） |
| `login_audit` | 登录审计 |
| `nav_item_health` | 链接健康检测 |
| `nav_item_logs` | 操作日志 |
| `misc` | 杂项 JSON 存储 |
| `schema_migrations` | 迁移版本记录（系统表） |

## 种子数据

| 账号 | 用户名 | 密码 | 角色 |
|------|--------|------|------|
| 管理员 | `admin` | `admin123` | super |
| 编辑 | `editor` | `admin123` | editor |

业务数据：导航 28 条、资源矩阵 10 条、小游戏 3 条、文章 6 篇、作品 3 个、统计 7 天。

## 部署步骤

1. 创建 MySQL 数据库：
   ```sql
   CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. 配置 `backend/config.yaml` 中的 DSN
3. 启动后端，首次自动完成建表 + 种子写入

## 约束

- 新增表结构 → 追加 `004_xxx.sql`，不能改历史迁移
- 已执行的迁移文件内容不可修改（checksum 校验）
- 密码使用 scrypt 哈希，bcrypt 旧格式在登录时自动升级
- `users.password` 仅兼容历史库，业务代码统一用 `users.password_hash`
