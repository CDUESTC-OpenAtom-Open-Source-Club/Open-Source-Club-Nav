import pool from "@/lib/db";
import { hashPassword } from "@/lib/admin-auth";

let initialized = false;

export async function ensureAdminTables(): Promise<void> {
  // 同一进程内只初始化一次，避免每个后台请求都重复建表。
  if (initialized) return;

  // 后台功能依赖的表统一在这里兜底创建，方便本地首次启动。
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(32) NOT NULL DEFAULT 'user',
      status TINYINT(1) NOT NULL DEFAULT 1,
      last_login_at DATETIME NULL,
      last_login_ip VARCHAR(45) NULL,
      created_by BIGINT UNSIGNED NULL,
      password_changed_at DATETIME NULL,
      created_at DATETIME(3) NULL,
      updated_at DATETIME(3) NULL,
      deleted_at DATETIME(3) NULL,
      username VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL DEFAULT '',
      UNIQUE KEY idx_users_username (username),
      KEY idx_users_role (role),
      KEY idx_users_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      stat_date DATE PRIMARY KEY,
      page_views INT NOT NULL DEFAULT 0,
      unique_visitors INT NOT NULL DEFAULT 0,
      link_clicks INT NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_visits (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      stat_date DATE NOT NULL,
      visitor_id VARCHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_daily_visits_stat_visitor (stat_date, visitor_id),
      INDEX idx_daily_visits_stat_date (stat_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nav_item_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nav_item_id BIGINT UNSIGNED NULL,
      action VARCHAR(32) NOT NULL,
      actor_user_id BIGINT UNSIGNED NOT NULL,
      actor_username VARCHAR(64) NOT NULL,
      actor_role VARCHAR(32) NOT NULL,
      detail JSON NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_nav_item_logs_item_time (nav_item_id, created_at),
      INDEX idx_nav_item_logs_actor_time (actor_user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nav_item_health (
      nav_item_id BIGINT UNSIGNED PRIMARY KEY,
      url VARCHAR(500) NOT NULL,
      status_code INT NULL,
      is_ok TINYINT(1) NOT NULL DEFAULT 1,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      message VARCHAR(255) NULL,
      response_time_ms INT NULL,
      INDEX idx_nav_item_health_checked_at (checked_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_audit (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      remote_addr VARCHAR(45) NOT NULL DEFAULT '',
      user_agent VARCHAR(255) NOT NULL DEFAULT '',
      success TINYINT(1) NOT NULL DEFAULT 0,
      reason VARCHAR(64) NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_login_audit_identity_time (username, remote_addr, created_at),
      INDEX idx_login_audit_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nav_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      content TEXT NOT NULL,
      cover_url VARCHAR(500) NOT NULL DEFAULT '',
      link_url VARCHAR(500) NOT NULL DEFAULT '',
      description VARCHAR(500) NOT NULL DEFAULT '',
      sort INT NOT NULL DEFAULT 0,
      active TINYINT(1) NOT NULL DEFAULT 1,
      category VARCHAR(64) NULL,
      icon_url VARCHAR(500) NULL,
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      created_at DATETIME(3) NULL,
      updated_at DATETIME(3) NULL,
      KEY idx_nav_items_title (title),
      KEY idx_nav_items_active_sort (active, sort, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(16) NOT NULL,
      nav_item_id BIGINT UNSIGNED NULL,
      target_url VARCHAR(500) NULL,
      target_label VARCHAR(255) NULL,
      source_context VARCHAR(128) NULL,
      visitor_id VARCHAR(64) NULL,
      page_path VARCHAR(255) NULL,
      referrer VARCHAR(500) NULL,
      user_agent VARCHAR(255) NULL,
      ip_hash CHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_metrics_event_time (event_type, created_at),
      KEY idx_metrics_item_time (nav_item_id, created_at),
      KEY idx_metrics_visitor_time (visitor_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS works (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(16) NOT NULL DEFAULT 'MANUAL',
      repo_url VARCHAR(500) NULL,
      title VARCHAR(160) NOT NULL,
      description TEXT NOT NULL,
      author_name VARCHAR(120) NOT NULL,
      author_avatar VARCHAR(500) NULL,
      tags JSON NOT NULL,
      color VARCHAR(16) NOT NULL DEFAULT '#0A84FF',
      status VARCHAR(32) NOT NULL DEFAULT '开发中',
      stars INT NOT NULL DEFAULT 0,
      preview_url VARCHAR(500) NULL,
      is_featured TINYINT(1) NOT NULL DEFAULT 1,
      display_order INT NOT NULL DEFAULT 0,
      last_synced_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_works_repo_url (repo_url),
      KEY idx_works_featured_order (is_featured, display_order, id),
      KEY idx_works_type (type),
      KEY idx_works_stars (stars)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  initialized = true;
}

export async function ensureBootstrapSuperUser(): Promise<void> {
  // 超级管理员只在 users 中没有后台角色时自动注入一次。
  // 如果历史种子仍是旧哈希格式，则用当前 bootstrap 密码刷新成统一格式。
  await ensureAdminTables();
  const username = (process.env.ADMIN_BOOTSTRAP_USERNAME || "admin").trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123456";
  const passwordHash = hashPassword(password);
  const [existingRows] = await pool.query(
    "SELECT id, password_hash, role FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  const existingUser = (existingRows as Array<{
    id: number;
    password_hash: string;
    role: string;
  }>)[0];

  if (existingUser) {
    if (!existingUser.password_hash.startsWith("scrypt:") || existingUser.role !== "super") {
      await pool.query(
        `UPDATE users
         SET password_hash = ?, role = 'super', status = 1, password = '', password_changed_at = NOW(),
             updated_at = NOW(3)
         WHERE id = ?`,
        [passwordHash, existingUser.id],
      );
    }
    return;
  }

  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM users WHERE role IN ('super', 'editor')",
  );
  const count = Number((rows as Array<{ count: number }>)[0]?.count || 0);
  if (count > 0) return;

  await pool.query(
    `INSERT INTO users
      (email, password_hash, role, status, username, password, password_changed_at, created_at, updated_at)
     VALUES (?, ?, 'super', 1, ?, '', NOW(), NOW(3), NOW(3))`,
    ["", passwordHash, username],
  );
}

export async function recordAdminLoginAttempt(params: {
  username: string;
  remoteAddr: string;
  userAgent: string;
  success: boolean;
  reason: string;
}): Promise<void> {
  await ensureAdminTables();
  await pool.query(
    `INSERT INTO login_audit
      (username, remote_addr, user_agent, success, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.username,
      params.remoteAddr.slice(0, 64),
      params.userAgent.slice(0, 255),
      params.success ? 1 : 0,
      params.reason.slice(0, 64),
    ],
  );
}

export async function getRecentAdminLoginFailures(params: {
  username: string;
  remoteAddr: string;
  withinMinutes: number;
}): Promise<number> {
  await ensureAdminTables();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM login_audit
     WHERE success = 0
       AND username = ?
       AND remote_addr = ?
       AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [params.username, params.remoteAddr, params.withinMinutes],
  );
  return Number((rows as Array<{ count: number }>)[0]?.count || 0);
}
