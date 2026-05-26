# OpenAtom-Club-Nav

## Backend database deployment

后端已经内置版本化数据库迁移和基础种子。

部署流程：

1. 创建 MySQL 数据库
2. 按 [backend/config.example.yaml](/Users/blackevil/OpenAtom-Club-Nav-main/backend/config.example.yaml) 准备配置文件
3. 启动后端服务
4. 服务启动时会自动执行 `backend/db/migrate/migrations/*.sql`

迁移特性：

- 使用 `schema_migrations` 记录已执行版本
- 已执行迁移不会重复跑
- 历史迁移文件如果被篡改，服务会因 checksum 不一致拒绝启动
- `003_seed_core_data.sql` 会初始化最小管理员和基础导航数据

详细说明见 [backend/db/README.md](/Users/blackevil/OpenAtom-Club-Nav-main/backend/db/README.md)。
