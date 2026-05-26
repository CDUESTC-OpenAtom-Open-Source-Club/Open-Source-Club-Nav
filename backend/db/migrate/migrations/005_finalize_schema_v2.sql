ALTER TABLE users
  ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN last_login_at DATETIME NULL AFTER status,
  ADD COLUMN last_login_ip VARCHAR(45) NULL AFTER last_login_at,
  ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER last_login_ip,
  ADD COLUMN password_changed_at DATETIME NULL AFTER created_by;

UPDATE users
SET role = 'super'
WHERE role = 'admin';

UPDATE users
SET password_changed_at = COALESCE(password_changed_at, updated_at, created_at, NOW(3))
WHERE password_hash <> '';

ALTER TABLE nav_items
  ADD COLUMN description VARCHAR(500) NOT NULL DEFAULT '' AFTER title,
  ADD COLUMN sort INT NOT NULL DEFAULT 0 AFTER description,
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER sort,
  ADD COLUMN category VARCHAR(64) NULL AFTER active,
  ADD COLUMN icon_url VARCHAR(500) NULL AFTER category,
  ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER icon_url,
  ADD COLUMN updated_by BIGINT UNSIGNED NULL AFTER created_by;

UPDATE nav_items
SET description = CASE
      WHEN description = '' AND content <> '' THEN LEFT(content, 500)
      ELSE description
    END,
    sort = CASE
      WHEN sort = 0 THEN id
      ELSE sort
    END,
    active = 1
WHERE 1 = 1;

CREATE TABLE IF NOT EXISTS login_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  remote_addr VARCHAR(45) NOT NULL DEFAULT '',
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  success TINYINT(1) NOT NULL DEFAULT 0,
  reason VARCHAR(64) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_audit_identity_time (username, remote_addr, created_at),
  KEY idx_login_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nav_item_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nav_item_id BIGINT UNSIGNED NULL,
  action VARCHAR(32) NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  actor_username VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  detail JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nav_item_logs_item_time (nav_item_id, created_at),
  KEY idx_nav_item_logs_actor_time (actor_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nav_item_health (
  nav_item_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  status_code INT NULL,
  is_ok TINYINT(1) NOT NULL DEFAULT 1,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message VARCHAR(255) NULL,
  response_time_ms INT NULL,
  PRIMARY KEY (nav_item_id),
  KEY idx_nav_item_health_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date DATE NOT NULL,
  page_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  link_clicks INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stat_date DATE NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_daily_visits_stat_visitor (stat_date, visitor_id),
  KEY idx_daily_visits_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(16) NOT NULL,
  nav_item_id BIGINT UNSIGNED NULL,
  visitor_id VARCHAR(64) NULL,
  page_path VARCHAR(255) NULL,
  referrer VARCHAR(500) NULL,
  user_agent VARCHAR(255) NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_metrics_event_time (event_type, created_at),
  KEY idx_metrics_item_time (nav_item_id, created_at),
  KEY idx_metrics_visitor_time (visitor_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS works (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (id),
  UNIQUE KEY uk_works_repo_url (repo_url),
  KEY idx_works_featured_order (is_featured, display_order, id),
  KEY idx_works_type (type),
  KEY idx_works_stars (stars)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
