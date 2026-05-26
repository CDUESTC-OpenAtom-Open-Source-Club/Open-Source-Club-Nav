# Database Migrations

后端现在使用应用内置 SQL 迁移，不再依赖 MySQL 首次启动时的 `docker-entrypoint-initdb.d`。

## 目录说明

- `migrate/migrations/001_*.sql`：结构基线
- `migrate/migrations/002_*.sql`：历史结构兼容修复
- `migrate/migrations/003_*.sql`：基础种子数据

## 启动行为

服务启动后会自动：

1. 连接 MySQL
2. 创建 `schema_migrations` 版本表
3. 按文件名顺序执行未应用的 SQL
4. 记录已执行版本和校验和

已经执行过的迁移不会重复执行；如果迁移文件内容被改动，服务会因 checksum 不一致而拒绝启动。

## 服务器部署

1. 创建数据库
2. 配置 `backend/config.yaml` 或 `CONFIG_PATH`
3. 启动后端服务
4. 首次启动会自动完成建表和基础种子写入

## 种子说明

- `003_seed_core_data.sql` 会写入最小可用管理员账号 `admin`
- 同时写入 3 条基础导航数据
- 这批数据是幂等的，重复启动不会重复插入

## 后续约束

- 新增表结构时，只能追加新的迁移文件，不能直接改历史迁移
- 如需演示数据，单独新增 `9xx_demo_*.sql`
- `users.password` 仅为兼容历史库保留，业务代码统一使用 `users.password_hash`
