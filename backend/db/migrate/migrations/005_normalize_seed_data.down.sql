-- 005_normalize_seed_data.down.sql (MySQL)
-- This migration rebuilds seed data destructively. Down migration removes the
-- normalized seed rows but does not restore pre-normalization runtime data.

DELETE FROM nav_item_health;
DELETE FROM nav_item_logs;
DELETE FROM login_audit;
DELETE FROM daily_visits;
DELETE FROM daily_stats;
DELETE FROM metrics;
DELETE FROM resource_matrix;
DELETE FROM works;
DELETE FROM articles;
DELETE FROM mini_games;
DELETE FROM nav_items;
DELETE FROM users
WHERE username IN ('admin', 'editor')
  AND email IN ('admin@example.com', 'editor@example.com');
