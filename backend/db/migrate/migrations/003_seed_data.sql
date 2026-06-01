-- 003_seed_data.sql (SQLite dialect)
-- 全量种子数据（migrator 通过 checksum 保证只执行一次）
-- 替换：NOW(3)/NOW() -> CURRENT_TIMESTAMP；CURDATE() -> date('now')；
--      DATE_SUB(CURDATE(), INTERVAL N DAY) -> date('now', '-N days')；
--      `desc` -> "desc"；ON DUPLICATE KEY UPDATE -> ON CONFLICT(...) DO UPDATE SET 或删除。

-- ============================================================
-- 1. nav_items
-- ============================================================
INSERT INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'think_tank', 'BookOpen', 'Git 入门指南', '版本控制基础教程，从零学会 Git', '版本控制基础教程', 1, 1, 'resource_matrix', '', 'https://git-scm.com/doc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'Terminal', 'Linux 常用命令', '终端操作速查手册，日常必备', '终端操作速查手册', 2, 1, 'resource_matrix', '', 'https://linux.die.net/man/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'Code', '数据结构与算法', '配套练习题资源，提升编程能力', '配套练习题资源', 3, 1, 'resource_matrix', '', 'https://leetcode.cn/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'GitPullRequest', '开源贡献指引', '如何给开源项目提交 PR', '如何给开源项目提交 PR', 4, 1, 'resource_matrix', '', 'https://docs.github.com/cn/get-started/exploring-projects-on-github', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'FileText', '浅谈前后端分离', '前后端分离架构设计入门', '前后端分离架构设计', 5, 1, 'resource_matrix', '', 'https://segmentfault.com/a/front-end-separation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'Container', 'Docker 容器化实践', 'Docker 容器化最佳实践', 'Docker 容器化最佳实践', 6, 1, 'resource_matrix', '', 'https://docs.docker.com/get-started/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'think_tank', 'Settings', 'API 设计规范', 'RESTful API 设计指南', 'RESTful API 设计指南', 7, 1, 'resource_matrix', '', 'https://swagger.io/specification/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'campus', 'GraduationCap', '成都理工大学工程技术学院', '社团所属院校官网', '社团所属院校官网', 1, 1, 'resource_matrix', '', 'https://www.cdutetc.cn/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'campus', 'Calendar', '2026 Q1 活动回顾', '2026 年第一季度社团活动回顾', '2026 年第一季度社团活动回顾', 2, 1, 'resource_matrix', '', '#', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'campus', 'Users', '新生见面会', '2026 秋季纳新活动回顾', '2026 秋季纳新活动回顾', 3, 1, 'resource_matrix', '', '#', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'campus', 'Bell', 'KCOS Club 招新公告', '2026 秋季纳新启动', '2026 秋季纳新启动', 4, 1, 'resource_matrix', '', 'https://opensouce-club.top/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'campus', 'RefreshCw', '社团换届', '2026 社团换届活动', '2026 社团换届活动', 5, 1, 'resource_matrix', '', '#', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'tools', 'Wrench', 'VS Code 插件合集', 'VS Code 高效开发插件推荐', 'VS Code 高效开发插件推荐', 1, 1, 'resource_matrix', '', 'https://marketplace.visualstudio.com/vscode', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'tools', 'Bot', 'AI 工具推荐', 'AI 辅助编程工具合集', 'AI 辅助编程工具合集', 2, 1, 'resource_matrix', '', 'https://openai.com/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'tools', 'Globe', '在线工具箱', '开发者常用在线工具', '开发者常用在线工具', 3, 1, 'resource_matrix', '', 'https://tool.lu/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'tools', 'Palette', 'Color Hunt', '配色灵感收集', '配色灵感收集', 4, 1, 'resource_matrix', '', 'https://colorhunt.co/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('resource_matrix', 'tools', 'Image', 'TinyPNG', '图片压缩工具', '图片压缩工具', 5, 1, 'resource_matrix', '', 'https://tinypng.com/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'Github', 'GitHub', '全球最大代码托管平台', '代码托管与开源协作平台', 1, 1, 'friend_links', '', 'https://github.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'Globe', 'OpenAtom 开放原子', '开放原子开源基金会', '开放原子开源基金会', 2, 1, 'friend_links', '', 'https://www.openatom.org/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'Users', 'KCOS Club', '科成开放原子开源社团', '科成开放原子开源社团', 3, 1, 'friend_links', '', 'https://opensouce-club.top/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'Code', 'Gitee', '国内代码托管平台', '国内代码托管平台', 4, 1, 'friend_links', '', 'https://gitee.com/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'BookOpen', 'MDN Web Docs', 'Web 开发权威文档', 'Web 开发权威文档', 5, 1, 'friend_links', '', 'https://developer.mozilla.org/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'Terminal', 'Stack Overflow', '全球开发者问答社区', '全球开发者问答社区', 6, 1, 'friend_links', '', 'https://stackoverflow.com/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'FileText', '阮一峰的网络日志', '前端技术博客', '前端技术博客', 7, 1, 'friend_links', '', 'https://www.ruanyifeng.com/blog/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('friend_links', NULL, 'GraduationCap', 'FreeCodeCamp', '免费编程学习平台', '免费编程学习平台', 8, 1, 'friend_links', '', 'https://www.freecodecamp.org/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mini_games', NULL, 'Gamepad2', '2048', '经典数字益智游戏', '经典数字益智游戏', 1, 1, 'mini_games', '', 'https://play2048.co/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mini_games', NULL, 'Crosshair', '在线俄罗斯方块', '经典休闲小游戏', '经典休闲小游戏', 2, 1, 'mini_games', '', 'https://tetris.com/play-tetris', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mini_games', NULL, 'Puzzle', '在线扫雷', '经典策略小游戏', '经典策略小游戏', 3, 1, 'mini_games', '', 'https://minesweeper.online/', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- 2. resource_matrix
-- ============================================================
INSERT INTO resource_matrix (category, name, url, "desc", tag, created_at, updated_at) VALUES
('智库', 'Git 入门指南', 'https://git-scm.com/doc', '版本控制基础教程', 'Git,教程', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('智库', 'Linux 常用命令', 'https://linux.die.net/man/', '终端操作速查手册', 'Linux,命令', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('智库', 'LeetCode 题库', 'https://leetcode.cn/', '数据结构与算法练习', '算法,刷题', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('智库', '开源贡献指引', 'https://docs.github.com/cn/get-started/exploring-projects-on-github', '如何给开源项目提交 PR', 'GitHub,PR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('智库', 'Docker 入门', 'https://docs.docker.com/get-started/', '容器化部署入门教程', 'Docker,容器', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('校园', '学校官网', 'https://www.cdutetc.cn/', '成都理工大学工程技术学院', '院校,官网', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('校园', '社团官网', 'https://opensouce-club.top/', '科成开放原子开源社团', '社团,官网', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('工具', 'VS Code', 'https://code.visualstudio.com/', '微软开源代码编辑器', '编辑器,IDE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('工具', 'TinyPNG', 'https://tinypng.com/', '图片压缩工具', '图片,压缩', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('工具', 'Color Hunt', 'https://colorhunt.co/', '配色灵感收集网站', '设计,配色', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- 3. mini_games
-- ============================================================
INSERT INTO mini_games (game_type, name, play_url, status, sort, created_at, updated_at) VALUES
('internal', '2048', 'https://play2048.co/', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('internal', '俄罗斯方块', 'https://tetris.com/play-tetris', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('internal', '扫雷', 'https://minesweeper.online/', 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- 4. articles
-- ============================================================
INSERT INTO articles (category, title, content, author, status, sort, created_at, updated_at) VALUES
('社团动态', 'KCOS Club 2026 秋季纳新启动', '科成开放原子开源社团 2026 秋季纳新活动正式开始！我们欢迎所有对开源技术感兴趣的同学加入，一起探索开源世界的无限可能。', 'admin', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('社团动态', '开源之夏 2026 参与指南', '开源之夏是由开放原子开源基金会发起的暑期开源活动，本文将介绍如何参与以及注意事项。', 'admin', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('技术分享', 'Git 工作流最佳实践', '本文介绍了 Git Flow、GitHub Flow 等常见工作流，帮助团队高效协作。', 'admin', 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('技术分享', 'Docker 入门：从零开始容器化你的应用', 'Docker 已成为现代开发必备技能，本文从安装到部署一步步带你入门。', 'admin', 1, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('技术分享', '前端性能优化实战指南', '从加载速度、渲染性能、网络请求等方面介绍前端性能优化的核心策略。', 'admin', 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('活动回顾', '2026 Q1 技术沙龙回顾', '2026 年第一季度技术沙龙活动圆满结束，同学们分享了自己在开源领域的探索与收获。', 'admin', 1, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- 5. works
-- ============================================================
INSERT INTO works (type, repo_url, title, description, author_name, tags, color, status, stars, is_featured, display_order, created_at, updated_at) VALUES
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav', 'Open-Source-Club-Nav', '开源社团导航站 - 基于 Next.js + Go + SQLite 的全栈项目', 'KCOS Club', '["Next.js", "Go", "SQLite", "TypeScript"]', '#0A84FF', 'active', 12, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/auto-checkin', 'auto-checkin', '校园网自动签到工具', 'KCOS Club', '["Python", "自动化"]', '#10B981', 'active', 8, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/club-website', 'club-website', '社团官网源码', 'KCOS Club', '["HTML", "CSS", "JavaScript"]', '#F59E0B', 'active', 5, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================
-- 6. daily_stats
-- ============================================================
INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks) VALUES
(date('now', '-6 days'), 320, 85, 62),
(date('now', '-5 days'), 415, 112, 78),
(date('now', '-4 days'), 280, 68, 45),
(date('now', '-3 days'), 512, 145, 96),
(date('now', '-2 days'), 390, 98, 72),
(date('now', '-1 day'),  468, 132, 88),
(date('now'),            156, 42,  31)
ON CONFLICT(stat_date) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- 7. metrics
-- ============================================================
INSERT INTO metrics (event_type, nav_item_id, target_url, target_label, source_context, visitor_id, page_path, created_at) VALUES
('visit', NULL, '/', '首页', 'direct',   'v_seed_001', '/', CURRENT_TIMESTAMP),
('visit', NULL, '/', '首页', 'direct',   'v_seed_002', '/', CURRENT_TIMESTAMP),
('click', 1,    'https://github.com',           'GitHub',    'friend_links', 'v_seed_001', '/', CURRENT_TIMESTAMP),
('click', 2,    'https://www.openatom.org/',    'OpenAtom',  'friend_links', 'v_seed_001', '/', CURRENT_TIMESTAMP),
('click', 3,    'https://opensouce-club.top/',  'KCOS Club', 'friend_links', 'v_seed_002', '/', CURRENT_TIMESTAMP),
('visit', NULL, '/', '首页', 'search',   'v_seed_003', '/', CURRENT_TIMESTAMP),
('click', 1,    'https://github.com',           'GitHub',    'friend_links', 'v_seed_003', '/', CURRENT_TIMESTAMP),
('visit', NULL, '/', '首页', 'referral', 'v_seed_004', '/', CURRENT_TIMESTAMP);
