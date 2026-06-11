-- 001_init_schema.up.sql (MySQL)
-- 完整建表语句

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status INT NOT NULL DEFAULT 1,
  last_login_at DATETIME(3) NULL,
  last_login_ip VARCHAR(45) NULL,
  created_by BIGINT UNSIGNED NULL,
  password_changed_at DATETIME(3) NULL,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  session TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_users_username (username),
  KEY idx_users_role (role),
  KEY idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 导航内容表
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'resource',
  sub_type VARCHAR(50) NULL,
  icon VARCHAR(100) NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  category VARCHAR(50) NULL,
  game_type VARCHAR(50) NULL,
  icon_url VARCHAR(500) NULL,
  cover_url VARCHAR(500) NOT NULL DEFAULT '',
  link_url VARCHAR(500) NOT NULL DEFAULT '',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_nav_items_content_type (content_type),
  KEY idx_nav_items_sub_type (sub_type),
  KEY idx_nav_items_title (title),
  KEY idx_nav_items_game_type (game_type),
  KEY idx_nav_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 资源矩阵
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_matrix (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  `desc` TEXT NULL,
  tag VARCHAR(200) NULL,
  PRIMARY KEY (id),
  KEY idx_resource_matrix_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 小游戏
-- ============================================================
CREATE TABLE IF NOT EXISTS mini_games (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_type VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  cover_url VARCHAR(500) DEFAULT '',
  play_url VARCHAR(500) NOT NULL,
  status TINYINT(1) DEFAULT 1,
  sort INT DEFAULT 0,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_mini_games_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 文章
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  cover_url VARCHAR(500) DEFAULT '',
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  status TINYINT(1) DEFAULT 1,
  sort INT DEFAULT 0,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_articles_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 社团作品 / GitHub 仓库
-- ============================================================
CREATE TABLE IF NOT EXISTS works (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  repo_url VARCHAR(500) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_avatar VARCHAR(500) NULL,
  tags TEXT NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#0A84FF',
  status VARCHAR(20) NOT NULL DEFAULT '开发中',
  stars INT NOT NULL DEFAULT 0,
  preview_url VARCHAR(500) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  last_synced_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_works_repo_url (repo_url),
  KEY idx_works_type (type),
  KEY idx_works_stars (stars),
  KEY idx_works_featured_order (is_featured, display_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 每日统计
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date VARCHAR(10) NOT NULL,
  page_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  link_clicks INT NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 每日访客明细
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stat_date VARCHAR(10) NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_daily_visits_stat_visitor (stat_date, visitor_id),
  KEY idx_daily_visits_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 事件指标
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(50) NOT NULL,
  nav_item_id BIGINT UNSIGNED NULL,
  target_url VARCHAR(500) NULL,
  target_label VARCHAR(200) NULL,
  source_context VARCHAR(100) NULL,
  visitor_id VARCHAR(100) NULL,
  page_path VARCHAR(500) NULL,
  referrer VARCHAR(500) NULL,
  user_agent TEXT NULL,
  ip_hash VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_metrics_event_type (event_type),
  KEY idx_metrics_nav_item_id (nav_item_id),
  KEY idx_metrics_visitor_id (visitor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 登录审计日志
-- ============================================================
CREATE TABLE IF NOT EXISTS login_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  remote_addr VARCHAR(45) NULL,
  user_agent TEXT NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  reason VARCHAR(200) NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 链接健康检测
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_health (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  link_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NULL,
  status_code INT NULL,
  is_ok TINYINT(1) NOT NULL DEFAULT 0,
  message VARCHAR(500) NULL,
  checked_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 内容操作日志
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  link_id BIGINT UNSIGNED NULL,
  action VARCHAR(50) NOT NULL,
  actor_username VARCHAR(100) NULL,
  actor_role VARCHAR(30) NULL,
  detail TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 杂项 JSON 存储
-- ============================================================
CREATE TABLE IF NOT EXISTS misc (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  other JSON NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
