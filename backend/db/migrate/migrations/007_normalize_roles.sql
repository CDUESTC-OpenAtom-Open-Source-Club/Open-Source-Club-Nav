-- 007_normalize_roles.sql
-- 统一角色口径：将历史遗留的 admin 角色规整为 super，
-- 与 Next BFF（super/editor/user）保持一致，消除两层权限语义分歧。
UPDATE users SET role = 'super' WHERE role = 'admin';
