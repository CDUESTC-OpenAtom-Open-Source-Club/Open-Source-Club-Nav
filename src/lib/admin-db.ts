import pool from "@/lib/db";
import { hashPassword } from "@/lib/admin-auth";

let initialized = false;

export async function ensureAdminTables(): Promise<void> {
  // 同一进程内只初始化一次，避免每个后台请求都重复建表。
  if (initialized) return;

  // 后台功能依赖的表统一在这里兜底创建，方便本地首次启动。
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('super', 'editor') NOT NULL DEFAULT 'editor',
      created_by INT NULL,
      last_login_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_daily_stats (
      stat_date DATE PRIMARY KEY,
      page_views INT NOT NULL DEFAULT 0,
      unique_visitors INT NOT NULL DEFAULT 0,
      link_clicks INT NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_daily_visits (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      stat_date DATE NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_stat_visitor (stat_date, visitor_id),
      INDEX idx_stat_date (stat_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_link_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      link_id INT NULL,
      action VARCHAR(32) NOT NULL,
      actor_user_id INT NOT NULL,
      actor_username VARCHAR(64) NOT NULL,
      actor_role ENUM('super', 'editor') NOT NULL,
      detail JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_link_time (link_id, created_at),
      INDEX idx_actor_time (actor_user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_link_health (
      link_id INT PRIMARY KEY,
      url VARCHAR(500) NOT NULL,
      status_code INT NULL,
      is_ok TINYINT(1) NOT NULL DEFAULT 1,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      message VARCHAR(255) NULL,
      INDEX idx_checked_at (checked_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  initialized = true;
}

export async function ensureBootstrapSuperUser(): Promise<void> {
  // 超级管理员只在 admin_users 为空时自动注入一次。
  await ensureAdminTables();
  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM admin_users");
  const count = Number((rows as Array<{ count: number }>)[0]?.count || 0);
  if (count > 0) return;

  const username = (process.env.ADMIN_BOOTSTRAP_USERNAME || "admin").trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123456";
  const passwordHash = hashPassword(password);

  await pool.query(
    "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, 'super')",
    [username, passwordHash],
  );
}
