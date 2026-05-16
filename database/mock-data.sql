-- KCOS 导航站数据库表结构
-- 使用前请先创建数据库: CREATE DATABASE kcos_nav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kcos_nav;

-- 友情链接表
CREATE TABLE IF NOT EXISTS friend_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '链接标题',
  url VARCHAR(500) NOT NULL COMMENT '链接地址',
  description VARCHAR(255) DEFAULT '' COMMENT '链接描述',
  sort INT DEFAULT 0 COMMENT '排序权重，越小越靠前',
  active TINYINT(1) DEFAULT 1 COMMENT '是否启用，1=启用 0=禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_sort (active, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='友情链接';

-- 初始数据
INSERT INTO friend_links (title, url, description, sort, active) VALUES
('Cooo Wiki 友链页', 'https://wiki.cooo.site/links', 'Cooo Wiki 友情链接', 1, 1),
('HDU CS Wiki', 'https://hdu-cs.wiki/', '杭电计算机知识库', 2, 1);

-- 成员作品表
CREATE TABLE IF NOT EXISTS works (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('GITHUB', 'MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT 'GITHUB=自动同步 MANUAL=手动录入',
  repo_url VARCHAR(500) DEFAULT NULL COMMENT 'GitHub 仓库地址',
  title VARCHAR(200) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目简介',
  author_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '作者姓名',
  author_avatar VARCHAR(255) DEFAULT '' COMMENT '作者头像 URL 或缩写',
  tags JSON COMMENT '技术栈标签',
  color VARCHAR(20) DEFAULT '#0A84FF' COMMENT '主题色',
  status VARCHAR(50) DEFAULT '开发中' COMMENT '状态',
  stars INT DEFAULT 0 COMMENT 'Star 数量',
  preview_url VARCHAR(500) DEFAULT NULL COMMENT '预览/演示地址',
  is_featured TINYINT(1) DEFAULT 1 COMMENT '是否在首页轮播展示',
  display_order INT DEFAULT 0 COMMENT '排序权重',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_repo_url (repo_url),
  INDEX idx_featured_order (is_featured, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成员作品';

-- 初始作品数据
INSERT INTO works (type, title, description, author_name, author_avatar, tags, color, status, stars, is_featured, display_order) VALUES
('MANUAL', '选课助手 Pro', '自动抢课 / 冲突检测 / 课表可视化', 'Zhang Wei', 'ZW', '["React","Python","FastAPI"]', '#0A84FF', '已上线', 128, 1, 1),
('MANUAL', '校园外卖比价器', '实时比价 / 拼单功能 / 历史价格趋势', 'Liu Fang', 'LF', '["Vue3","Node.js","Redis"]', '#06E5CC', '开发中', 87, 1, 2),
('MANUAL', '摸鱼时钟', '番茄钟 / 任务追踪 / 团队协作看板', 'Chen Hao', 'CH', '["TypeScript","Prisma","WebSocket"]', '#7C3AED', '已上线', 203, 1, 3),
('MANUAL', 'OpenAI 实验室', '大模型 Prompt 调试 / 对话记录云端同步', 'Wang Jing', 'WJ', '["Next.js","OpenAI API","Supabase"]', '#F59E0B', '内测中', 156, 1, 4),
('MANUAL', '成电路线导航', '室内导航 / 空教室查询 / 一键打印路线', 'Li Ming', 'LM', '["Flutter","Go","PostgreSQL"]', '#EF4444', '已上线', 94, 1, 5),
('MANUAL', 'HexBoard', '极简六边形笔记板 / Markdown / 本地优先', 'Zhao Yu', 'ZY', '["Electron","SQLite","ProseMirror"]', '#10B981', '已上线', 312, 1, 6),
('MANUAL', 'StarLink CLI', 'Git 工作流工具 / 自动化提交规范', 'Sun Lei', 'SL', '["Rust","CLI","Shell"]', '#38BDF8', '开发中', 67, 1, 7),
('MANUAL', '开源贡献看板', '社团成员贡献可视化 / GitHub Stats', 'Huang Xin', 'HX', '["D3.js","GitHub API","Vercel"]', '#EC4899', '已上线', 143, 1, 8);

-- 管理后台用户
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '登录用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role ENUM('super', 'editor') NOT NULL DEFAULT 'editor' COMMENT '角色',
  created_by INT NULL COMMENT '创建人 ID',
  last_login_at DATETIME NULL COMMENT '最近登录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台用户';

-- 每日统计
CREATE TABLE IF NOT EXISTS admin_daily_stats (
  stat_date DATE PRIMARY KEY COMMENT '统计日期',
  page_views INT NOT NULL DEFAULT 0 COMMENT '客流量(PV)',
  unique_visitors INT NOT NULL DEFAULT 0 COMMENT '客流量(UV)',
  link_clicks INT NOT NULL DEFAULT 0 COMMENT '链接点击量',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台每日统计';

-- 每日访客去重明细
CREATE TABLE IF NOT EXISTS admin_daily_visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  visitor_id VARCHAR(64) NOT NULL COMMENT '访客 ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_stat_visitor (stat_date, visitor_id),
  INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日访客去重';

-- 链接操作日志
CREATE TABLE IF NOT EXISTS admin_link_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  link_id INT NULL COMMENT '链接 ID',
  action VARCHAR(20) NOT NULL COMMENT '操作类型：create/update/delete/disable/enable',
  actor_user_id INT NOT NULL COMMENT '操作者 ID',
  actor_username VARCHAR(64) NOT NULL COMMENT '操作者用户名',
  actor_role VARCHAR(20) NOT NULL COMMENT '操作者角色',
  detail JSON NULL COMMENT '操作详情',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='链接操作日志';

-- 友链健康检测
CREATE TABLE IF NOT EXISTS admin_link_health (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  link_id INT NOT NULL COMMENT '链接 ID',
  url VARCHAR(500) NOT NULL COMMENT '检测 URL',
  status_code INT NULL COMMENT 'HTTP 状态码',
  is_ok TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否正常',
  message VARCHAR(255) DEFAULT '' COMMENT '检测信息',
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
  INDEX idx_link_id (link_id),
  INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='友链健康检测';
