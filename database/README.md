# database 目录说明

- `schema.sql`：MySQL 表结构与初始数据参考。
- `../scripts/db-init.ts`：本地数据库初始化脚本，执行方式为 `npm run db:init`。

表结构调整时，需要同步更新 `schema.sql`、初始化脚本，以及相关 API 的字段映射。
