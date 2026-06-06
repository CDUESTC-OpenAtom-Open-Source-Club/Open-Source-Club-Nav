-- 003_seed_core_data.down.sql：回滚核心种子数据
DELETE FROM users
WHERE username = 'admin'
  AND email = 'admin@example.com';

DELETE FROM nav_items
WHERE title IN ('GitHub', 'OpenAtom', 'KCOS_club');
