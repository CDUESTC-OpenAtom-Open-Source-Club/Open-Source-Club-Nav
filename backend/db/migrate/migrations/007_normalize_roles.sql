-- 007_normalize_roles.sql
-- 统一角色口径：将历史遗留的 admin 角色规整为 editor，
-- 与 Next BFF（super/editor/user）保持一致，消除两层权限语义分歧。
-- 注意：这里刻意不将 admin 整体提升为 super，避免越权；
-- 指定的超级管理员（用户名 admin）由 Next 引导逻辑按用户名单独提升为 super。
UPDATE users SET role = 'editor' WHERE role = 'admin';
