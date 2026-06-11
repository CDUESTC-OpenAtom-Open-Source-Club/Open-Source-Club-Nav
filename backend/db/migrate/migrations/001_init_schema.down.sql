-- 001_init_schema.down.sql：回滚时删除所有表
DROP TABLE IF EXISTS nav_item_logs;
DROP TABLE IF EXISTS nav_item_health;
DROP TABLE IF EXISTS login_audit;
DROP TABLE IF EXISTS metrics;
DROP TABLE IF EXISTS daily_visits;
DROP TABLE IF EXISTS daily_stats;
DROP TABLE IF EXISTS works;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS mini_games;
DROP TABLE IF EXISTS resource_matrix;
DROP TABLE IF EXISTS nav_items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS misc;
