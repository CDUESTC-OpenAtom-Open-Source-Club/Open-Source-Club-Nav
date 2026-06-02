-- 001_init_schema.down.sql：回滚时删除所有表
DROP TABLE IF EXISTS nav_items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schema_migrations; -- 原迁移记录表示例