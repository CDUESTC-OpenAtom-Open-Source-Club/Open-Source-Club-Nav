-- ============================================================
-- Open-Source-Club-Nav 完整数据库初始化脚本 (MySQL)
-- 使用方法: mysql -u root -p < db/init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS test_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE test_db;

-- ============================================================
-- 1. 用户表
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
-- 2. 导航内容表
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
  business_table VARCHAR(50) NULL,
  business_table_id INT NULL,
  PRIMARY KEY (id),
  KEY idx_nav_items_content_type (content_type),
  KEY idx_nav_items_sub_type (sub_type),
  KEY idx_nav_items_title (title),
  KEY idx_nav_items_game_type (game_type),
  KEY idx_nav_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. 友情链接表
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. 资源矩阵
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_matrix (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  `desc` TEXT NULL,
  tag VARCHAR(200) NULL,
  PRIMARY KEY (id),
  KEY idx_resource_matrix_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. 小游戏
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
-- 6. 文章
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
-- 7. 社团作品 / GitHub 仓库
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
-- 8. 每日统计
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date DATE NOT NULL,
  page_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  link_clicks INT NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. 每日访客明细
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  stat_date DATE NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_daily_visits_stat_visitor (stat_date, visitor_id),
  KEY idx_daily_visits_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. 事件指标
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(16) NOT NULL,
  nav_item_id BIGINT UNSIGNED NULL,
  target_url VARCHAR(500) NULL,
  target_label VARCHAR(255) NULL,
  source_context VARCHAR(128) NULL,
  visitor_id VARCHAR(64) NULL,
  page_path VARCHAR(255) NULL,
  referrer VARCHAR(500) NULL,
  user_agent VARCHAR(255) NULL,
  ip_hash VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_metrics_event_type (event_type),
  KEY idx_metrics_nav_item_id (nav_item_id),
  KEY idx_metrics_visitor_id (visitor_id),
  KEY idx_metrics_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. 登录审计日志
-- ============================================================
CREATE TABLE IF NOT EXISTS login_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  remote_addr VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  reason VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. 链接健康检测
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_health (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  link_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NULL,
  status_code INT NULL,
  is_ok TINYINT(1) NOT NULL DEFAULT 0,
  message VARCHAR(500) NULL,
  checked_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_nav_item_health_link_id (link_id),
  KEY idx_nav_item_health_ok_time (is_ok, checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. 内容操作日志（与 Go model 对齐）
-- ============================================================
CREATE TABLE IF NOT EXISTS nav_item_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nav_item_id BIGINT UNSIGNED NULL,
  action VARCHAR(32) NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  actor_username VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  detail JSON NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_nav_item_logs_created_at (created_at),
  KEY idx_nav_item_logs_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. 杂项 JSON 存储
-- ============================================================
CREATE TABLE IF NOT EXISTS misc (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  other JSON NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 种子数据
-- ============================================================

-- 管理员账号（密码均为 admin123，bcrypt 哈希）
INSERT INTO users (email, password_hash, role, username, password, created_at, updated_at)
VALUES
  ('admin@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'super', 'admin', '', NOW(3), NOW(3)),
  ('editor@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'editor', 'editor', '', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  updated_at = NOW(3);

-- 导航数据
INSERT INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'think_tank', 'Brain', 'CS 自学路线图', '完整计算机科学自学路径', '完整计算机科学自学路径', 1, 1, 'resource_matrix', '', 'https://roadmap.sh/computer-science', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'LeetCode', '算法刷题 · 面试准备', '算法刷题 · 面试准备', 2, 1, 'resource_matrix', '', 'https://leetcode.cn', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '知网 CNKI', '中文学术论文数据库', '中文学术论文数据库', 3, 1, 'resource_matrix', '', 'https://www.cnki.net', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'arXiv', '最新 AI / CS 预印本论文', '最新 AI / CS 预印本论文', 4, 1, 'resource_matrix', '', 'https://arxiv.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'Coursera', '顶尖高校在线课程', '顶尖高校在线课程', 5, 1, 'resource_matrix', '', 'https://www.coursera.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'MIT OCW', 'MIT 开放课程', 'MIT 开放课程', 6, 1, 'resource_matrix', '', 'https://ocw.mit.edu', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '牛客网', '面试刷题 · 笔试真题', '面试刷题 · 笔试真题', 7, 1, 'resource_matrix', '', 'https://www.nowcoder.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '洛谷', '算法竞赛训练平台', '算法竞赛训练平台', 8, 1, 'resource_matrix', '', 'https://www.luogu.com.cn', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '中国大学MOOC', '国内高校优质课程', '国内高校优质课程', 9, 1, 'resource_matrix', '', 'https://www.icourse163.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'edX', '哈佛MIT等名校课程', '哈佛MIT等名校课程', 10, 1, 'resource_matrix', '', 'https://www.edx.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'Kaggle', '数据科学竞赛平台', '数据科学竞赛平台', 11, 1, 'resource_matrix', '', 'https://www.kaggle.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'W3Schools', 'Web开发入门教程', 'Web开发入门教程', 12, 1, 'resource_matrix', '', 'https://www.w3schools.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'GeeksforGeeks', '计算机科学知识库', '计算机科学知识库', 13, 1, 'resource_matrix', '', 'https://www.geeksforgeeks.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '菜鸟教程', '编程语言入门指南', '编程语言入门指南', 14, 1, 'resource_matrix', '', 'https://www.runoob.com', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '教务处系统', '成绩查询 · 选课 · 教务公告', '成绩查询 · 选课 · 教务公告', 1, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '图书馆资源', '电子书 · 数据库 · 预约', '电子书 · 数据库 · 预约', 2, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '校园卡服务', '余额查询 · 挂失 · 充值', '余额查询 · 挂失 · 充值', 3, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '学工系统', '奖助学金 · 素质测评', '奖助学金 · 素质测评', 4, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '后勤服务', '报修 · 校车 · 一卡通', '报修 · 校车 · 一卡通', 5, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '外卖点位图', '校园外卖集中取餐坐标', '校园外卖集中取餐坐标', 6, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '就业信息网', '招聘信息 · 就业指导', '招聘信息 · 就业指导', 7, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '创新创业中心', '创业指导 · 项目孵化', '创业指导 · 项目孵化', 8, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '学术讲座公告', '学术活动 · 讲座信息', '学术活动 · 讲座信息', 9, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '校园地图', '校园导航 · 建筑分布', '校园导航 · 建筑分布', 10, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '校历查询', '学期安排 · 假期时间', '学期安排 · 假期时间', 11, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '实验室预约', '实验室使用预约系统', '实验室使用预约系统', 12, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'GitHub', '代码托管 · 开源协作平台', '代码托管 · 开源协作平台', 1, 1, 'resource_matrix', '', 'https://github.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', '清华开源镜像站', '国内高速软件下载镜像', '国内高速软件下载镜像', 2, 1, 'resource_matrix', '', 'https://mirrors.tuna.tsinghua.edu.cn', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'VS Code', '微软开源代码编辑器', '微软开源代码编辑器', 3, 1, 'resource_matrix', '', 'https://code.visualstudio.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Docker Hub', '容器镜像 · 一键部署', '容器镜像 · 一键部署', 4, 1, 'resource_matrix', '', 'https://hub.docker.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'MDN Web Docs', '前端开发权威参考文档', '前端开发权威参考文档', 5, 1, 'resource_matrix', '', 'https://developer.mozilla.org', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'DevDocs.io', '多语言开发文档聚合', '多语言开发文档聚合', 6, 1, 'resource_matrix', '', 'https://devdocs.io', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Git', '分布式版本控制系统', '分布式版本控制系统', 7, 1, 'resource_matrix', '', 'https://git-scm.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Postman', 'API测试与协作平台', 'API测试与协作平台', 8, 1, 'resource_matrix', '', 'https://www.postman.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Figma', 'UI/UX设计协作工具', 'UI/UX设计协作工具', 9, 1, 'resource_matrix', '', 'https://www.figma.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Notion', '知识管理与协作平台', '知识管理与协作平台', 10, 1, 'resource_matrix', '', 'https://www.notion.so', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Obsidian', '本地知识管理工具', '本地知识管理工具', 11, 1, 'resource_matrix', '', 'https://obsidian.md', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Typora', '极简Markdown编辑器', '极简Markdown编辑器', 12, 1, 'resource_matrix', '', 'https://typora.io', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Vercel', '前端部署与托管平台', '前端部署与托管平台', 13, 1, 'resource_matrix', '', 'https://vercel.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Google Fonts', '免费开源字体资源库', '免费开源字体资源库', 14, 1, 'resource_matrix', '', 'https://fonts.google.com', NOW(3), NOW(3)),
('friend_links', NULL, 'Github', 'GitHub', '全球最大代码托管平台', '代码托管与开源协作平台', 1, 1, 'friend_links', '', 'https://github.com', NOW(3), NOW(3)),
('friend_links', NULL, 'Globe', 'OpenAtom 开放原子', '开放原子开源基金会', '开放原子开源基金会', 2, 1, 'friend_links', '', 'https://www.openatom.org/', NOW(3), NOW(3)),
('friend_links', NULL, 'Users', 'KCOS Club', '科成开放原子开源社团', '科成开放原子开源社团', 3, 1, 'friend_links', '', 'https://opensouce-club.top/', NOW(3), NOW(3)),
('friend_links', NULL, 'Code', 'Gitee', '国内代码托管平台', '国内代码托管平台', 4, 1, 'friend_links', '', 'https://gitee.com/', NOW(3), NOW(3)),
('friend_links', NULL, 'BookOpen', 'MDN Web Docs', 'Web 开发权威文档', 'Web 开发权威文档', 5, 1, 'friend_links', '', 'https://developer.mozilla.org/', NOW(3), NOW(3)),
('friend_links', NULL, 'Terminal', 'Stack Overflow', '全球开发者问答社区', '全球开发者问答社区', 6, 1, 'friend_links', '', 'https://stackoverflow.com/', NOW(3), NOW(3)),
('friend_links', NULL, 'FileText', '阮一峰的网络日志', '前端技术博客', '前端技术博客', 7, 1, 'friend_links', '', 'https://www.ruanyifeng.com/blog/', NOW(3), NOW(3)),
('friend_links', NULL, 'GraduationCap', 'FreeCodeCamp', '免费编程学习平台', '免费编程学习平台', 8, 1, 'friend_links', '', 'https://www.freecodecamp.org/', NOW(3), NOW(3)),
('mini_games', NULL, 'Gamepad2', '2048', '经典数字益智游戏', '经典数字益智游戏', 1, 1, 'mini_games', '', 'https://play2048.co/', NOW(3), NOW(3)),
('mini_games', NULL, 'Crosshair', '在线俄罗斯方块', '经典休闲小游戏', '经典休闲小游戏', 2, 1, 'mini_games', '', 'https://tetris.com/play-tetris', NOW(3), NOW(3)),
('mini_games', NULL, 'Puzzle', '在线扫雷', '经典策略小游戏', '经典策略小游戏', 3, 1, 'mini_games', '', 'https://minesweeper.online/', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- 友情链接
INSERT INTO friend_links (title, link_url, sort, created_at, updated_at) VALUES
('GitHub', 'https://github.com', 1, NOW(3), NOW(3)),
('OpenAtom 开放原子', 'https://www.openatom.org/', 2, NOW(3), NOW(3)),
('KCOS Club', 'https://opensouce-club.top/', 3, NOW(3), NOW(3)),
('Gitee', 'https://gitee.com/', 4, NOW(3), NOW(3)),
('MDN Web Docs', 'https://developer.mozilla.org/', 5, NOW(3), NOW(3)),
('Stack Overflow', 'https://stackoverflow.com/', 6, NOW(3), NOW(3)),
('阮一峰的网络日志', 'https://www.ruanyifeng.com/blog/', 7, NOW(3), NOW(3)),
('FreeCodeCamp', 'https://www.freecodecamp.org/', 8, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- 小游戏
INSERT INTO mini_games (game_type, name, play_url, status, sort, created_at, updated_at) VALUES
('internal', '2048', 'https://play2048.co/', 1, 1, NOW(3), NOW(3)),
('internal', '俄罗斯方块', 'https://tetris.com/play-tetris', 1, 2, NOW(3), NOW(3)),
('internal', '扫雷', 'https://minesweeper.online/', 1, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- 文章
INSERT INTO articles (category, title, content, author, status, sort, created_at, updated_at) VALUES
('社团动态', 'KCOS Club 2026 秋季纳新启动', '科成开放原子开源社团 2026 秋季纳新活动正式开始！我们欢迎所有对开源技术感兴趣的同学加入，一起探索开源世界的无限可能。', 'admin', 1, 1, NOW(3), NOW(3)),
('社团动态', '开源之夏 2026 参与指南', '开源之夏是由开放原子开源基金会发起的暑期开源活动，本文将介绍如何参与以及注意事项。', 'admin', 1, 2, NOW(3), NOW(3)),
('技术分享', 'Git 工作流最佳实践', '本文介绍了 Git Flow、GitHub Flow 等常见工作流，帮助团队高效协作。', 'admin', 1, 3, NOW(3), NOW(3)),
('技术分享', 'Docker 入门：从零开始容器化你的应用', 'Docker 已成为现代开发必备技能，本文从安装到部署一步步带你入门。', 'admin', 1, 4, NOW(3), NOW(3)),
('技术分享', '前端性能优化实战指南', '从加载速度、渲染性能、网络请求等方面介绍前端性能优化的核心策略。', 'admin', 1, 5, NOW(3), NOW(3)),
('活动回顾', '2026 Q1 技术沙龙回顾', '2026 年第一季度技术沙龙活动圆满结束，同学们分享了自己在开源领域的探索与收获。', 'admin', 1, 6, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- 社团作品
INSERT INTO works (type, repo_url, title, description, author_name, tags, color, status, stars, is_featured, display_order, created_at, updated_at) VALUES
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav', 'Open-Source-Club-Nav', '开源社团导航站 - 基于 Next.js + Go + MySQL 的全栈项目', 'KCOS Club', '["Next.js", "Go", "MySQL", "TypeScript"]', '#0A84FF', 'active', 12, 1, 1, NOW(3), NOW(3)),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/auto-checkin', 'auto-checkin', '校园网自动签到工具', 'KCOS Club', '["Python", "自动化"]', '#10B981', 'active', 8, 1, 2, NOW(3), NOW(3)),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/club-website', 'club-website', '社团官网源码', 'KCOS Club', '["HTML", "CSS", "JavaScript"]', '#F59E0B', 'active', 5, 0, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);
