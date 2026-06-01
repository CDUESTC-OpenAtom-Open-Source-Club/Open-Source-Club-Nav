-- 001_schema.sql (SQLite dialect)
-- 所有表结构的完整定义（CREATE TABLE IF NOT EXISTS）
-- SQLite: 用 INTEGER PRIMARY KEY AUTOINCREMENT 代替 BIGINT UNSIGNED AUTO_INCREMENT,
-- TINYINT(1) -> INTEGER, DATETIME(3) -> DATETIME, JSON -> TEXT,
-- 索引一律单独 CREATE INDEX, 去除 ENGINE/CHARSET/COMMENT/ON UPDATE 子句。

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  status INTEGER NOT NULL DEFAULT 1,
  last_login_at DATETIME,
  last_login_ip TEXT,
  created_by INTEGER,
  password_changed_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME,
  username TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  session TEXT DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 导航内容表
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL DEFAULT 'resource',
  sub_type TEXT,
  icon TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  game_type TEXT,
  icon_url TEXT,
  cover_url TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  updated_by INTEGER,
  created_at DATETIME,
  updated_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_nav_items_content_type ON nav_items(content_type);
CREATE INDEX IF NOT EXISTS idx_nav_items_sub_type ON nav_items(sub_type);
CREATE INDEX IF NOT EXISTS idx_nav_items_title ON nav_items(title);
CREATE INDEX IF NOT EXISTS idx_nav_items_game_type ON nav_items(game_type);

-- ============================================================
-- 资源矩阵独立表
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  "desc" TEXT,
  tag TEXT
);
CREATE INDEX IF NOT EXISTS idx_resource_matrix_deleted_at ON resource_matrix(deleted_at);

-- ============================================================
-- 小游戏独立表
-- ============================================================
CREATE TABLE IF NOT EXISTS mini_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_type TEXT NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  play_url TEXT NOT NULL,
  status INTEGER DEFAULT 1,
  sort INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mini_games_name ON mini_games(name);

-- ============================================================
-- 文章表
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  status INTEGER DEFAULT 1,
  sort INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_title ON articles(title);

-- ============================================================
-- 社团作品 / GitHub 仓库
-- ============================================================
CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'MANUAL',
  repo_url TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  tags TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0A84FF',
  status TEXT NOT NULL DEFAULT '开发中',
  stars INTEGER NOT NULL DEFAULT 0,
  preview_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  last_synced_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_works_repo_url ON works(repo_url);
CREATE INDEX IF NOT EXISTS idx_works_type ON works(type);
CREATE INDEX IF NOT EXISTS idx_works_stars ON works(stars);
CREATE INDEX IF NOT EXISTS idx_works_featured_order ON works(is_featured, display_order, id);

-- ============================================================
-- 每日统计
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date TEXT NOT NULL PRIMARY KEY,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 每日访客明细
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_daily_visits_stat_visitor ON daily_visits(stat_date, visitor_id);
CREATE INDEX IF NOT EXISTS idx_daily_visits_stat_date ON daily_visits(stat_date);

-- ============================================================
-- 事件指标（访问 / 点击）
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  nav_item_id INTEGER,
  target_url TEXT,
  target_label TEXT,
  source_context TEXT,
  visitor_id TEXT,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metrics_event_type ON metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_metrics_nav_item_id ON metrics(nav_item_id);
CREATE INDEX IF NOT EXISTS idx_metrics_visitor_id ON metrics(visitor_id);

-- ============================================================
-- 登录审计日志
-- ============================================================
CREATE TABLE IF NOT EXISTS login_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  remote_addr TEXT,
  user_agent TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 链接健康检测
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,
  title TEXT,
  status_code INTEGER,
  is_ok INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 内容操作日志
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER,
  action TEXT NOT NULL,
  actor_username TEXT,
  actor_role TEXT,
  detail TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 杂项 JSON 存储
-- ============================================================
CREATE TABLE IF NOT EXISTS misc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  other TEXT
);
