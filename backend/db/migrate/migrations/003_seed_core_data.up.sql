-- 003_seed_core_data.up.sql (MySQL)
-- 核心种子数据

-- ============================================================
-- 管理员账号（密码均为 admin123，bcrypt 哈希）
-- ============================================================
INSERT INTO users (email, password_hash, role, username, password, created_at, updated_at)
VALUES
  ('admin@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'super', 'admin', '', NOW(3), NOW(3)),
  ('editor@example.com', '$2a$10$fsoxTaSewAAg0g.FA72XWuQ6eO/kODnviKG3rjEjiT1Po6Gux/2EW', 'editor', 'editor', '', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  updated_at = NOW(3);

-- ============================================================
-- 导航数据
-- ============================================================
INSERT INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'think_tank', 'BookOpen', 'Git 入门指南', '版本控制基础教程，从零学会 Git', '版本控制基础教程', 1, 1, 'resource_matrix', '', 'https://git-scm.com/doc', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Terminal', 'Linux 常用命令', '终端操作速查手册，日常必备', '终端操作速查手册', 2, 1, 'resource_matrix', '', 'https://linux.die.net/man/', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Code', '数据结构与算法', '配套练习题资源，提升编程能力', '配套练习题资源', 3, 1, 'resource_matrix', '', 'https://leetcode.cn/', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'GitPullRequest', '开源贡献指引', '如何给开源项目提交 PR', '如何给开源项目提交 PR', 4, 1, 'resource_matrix', '', 'https://docs.github.com/cn/get-started/exploring-projects-on-github', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'FileText', '浅谈前后端分离', '前后端分离架构设计入门', '前后端分离架构设计', 5, 1, 'resource_matrix', '', 'https://segmentfault.com/a/front-end-separation', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Container', 'Docker 容器化实践', 'Docker 容器化最佳实践', 'Docker 容器化最佳实践', 6, 1, 'resource_matrix', '', 'https://docs.docker.com/get-started/', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Settings', 'API 设计规范', 'RESTful API 设计指南', 'RESTful API 设计指南', 7, 1, 'resource_matrix', '', 'https://swagger.io/specification/', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'GraduationCap', '成都理工大学工程技术学院', '社团所属院校官网', '社团所属院校官网', 1, 1, 'resource_matrix', '', 'https://www.cdutetc.cn/', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'Calendar', '2026 Q1 活动回顾', '2026 年第一季度社团活动回顾', '2026 年第一季度社团活动回顾', 2, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'Users', '新生见面会', '2026 秋季纳新活动回顾', '2026 秋季纳新活动回顾', 3, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'Bell', 'KCOS Club 招新公告', '2026 秋季纳新启动', '2026 秋季纳新启动', 4, 1, 'resource_matrix', '', 'https://opensouce-club.top/', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'RefreshCw', '社团换届', '2026 社团换届活动', '2026 社团换届活动', 5, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'VS Code 插件合集', 'VS Code 高效开发插件推荐', 'VS Code 高效开发插件推荐', 1, 1, 'resource_matrix', '', 'https://marketplace.visualstudio.com/vscode', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Bot', 'AI 工具推荐', 'AI 辅助编程工具合集', 'AI 辅助编程工具合集', 2, 1, 'resource_matrix', '', 'https://openai.com/', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Globe', '在线工具箱', '开发者常用在线工具', '开发者常用在线工具', 3, 1, 'resource_matrix', '', 'https://tool.lu/', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Palette', 'Color Hunt', '配色灵感收集', '配色灵感收集', 4, 1, 'resource_matrix', '', 'https://colorhunt.co/', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Image', 'TinyPNG', '图片压缩工具', '图片压缩工具', 5, 1, 'resource_matrix', '', 'https://tinypng.com/', NOW(3), NOW(3)),
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

-- ============================================================
-- 小游戏
-- ============================================================
INSERT INTO mini_games (game_type, name, play_url, status, sort, created_at, updated_at) VALUES
('internal', '2048', 'https://play2048.co/', 1, 1, NOW(3), NOW(3)),
('internal', '俄罗斯方块', 'https://tetris.com/play-tetris', 1, 2, NOW(3), NOW(3)),
('internal', '扫雷', 'https://minesweeper.online/', 1, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- ============================================================
-- 文章
-- ============================================================
INSERT INTO articles (category, title, content, author, status, sort, created_at, updated_at) VALUES
('社团动态', 'KCOS Club 2026 秋季纳新启动', '科成开放原子开源社团 2026 秋季纳新活动正式开始！我们欢迎所有对开源技术感兴趣的同学加入，一起探索开源世界的无限可能。', 'admin', 1, 1, NOW(3), NOW(3)),
('社团动态', '开源之夏 2026 参与指南', '开源之夏是由开放原子开源基金会发起的暑期开源活动，本文将介绍如何参与以及注意事项。', 'admin', 1, 2, NOW(3), NOW(3)),
('技术分享', 'Git 工作流最佳实践', '本文介绍了 Git Flow、GitHub Flow 等常见工作流，帮助团队高效协作。', 'admin', 1, 3, NOW(3), NOW(3)),
('技术分享', 'Docker 入门：从零开始容器化你的应用', 'Docker 已成为现代开发必备技能，本文从安装到部署一步步带你入门。', 'admin', 1, 4, NOW(3), NOW(3)),
('技术分享', '前端性能优化实战指南', '从加载速度、渲染性能、网络请求等方面介绍前端性能优化的核心策略。', 'admin', 1, 5, NOW(3), NOW(3)),
('活动回顾', '2026 Q1 技术沙龙回顾', '2026 年第一季度技术沙龙活动圆满结束，同学们分享了自己在开源领域的探索与收获。', 'admin', 1, 6, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);

-- ============================================================
-- 社团作品
-- ============================================================
INSERT INTO works (type, repo_url, title, description, author_name, tags, color, status, stars, is_featured, display_order, created_at, updated_at) VALUES
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav', 'Open-Source-Club-Nav', '开源社团导航站 - 基于 Next.js + Go + MySQL 的全栈项目', 'KCOS Club', '["Next.js", "Go", "MySQL", "TypeScript"]', '#0A84FF', 'active', 12, 1, 1, NOW(3), NOW(3)),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/auto-checkin', 'auto-checkin', '校园网自动签到工具', 'KCOS Club', '["Python", "自动化"]', '#10B981', 'active', 8, 1, 2, NOW(3), NOW(3)),
('GITHUB', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/club-website', 'club-website', '社团官网源码', 'KCOS Club', '["HTML", "CSS", "JavaScript"]', '#F59E0B', 'active', 5, 0, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);
