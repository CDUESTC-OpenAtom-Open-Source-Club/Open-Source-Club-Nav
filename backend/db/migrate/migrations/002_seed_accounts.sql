-- 002_seed_accounts.sql (SQLite dialect)
-- 种子用户账号（幂等：ON CONFLICT DO UPDATE）
-- 密码均为 admin123，bcrypt 哈希，首次登录后自动升级为 scrypt

INSERT INTO users (email, password_hash, role, username, password, created_at, updated_at)
VALUES ('admin@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'super', 'admin', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO UPDATE SET role = 'super', updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (email, password_hash, role, username, password, created_at, updated_at)
VALUES ('editor@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'editor', 'editor', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(username) DO UPDATE SET role = 'editor', updated_at = CURRENT_TIMESTAMP;
