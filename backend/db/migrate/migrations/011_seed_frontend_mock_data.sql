-- 011_seed_frontend_mock_data.sql
-- 将前端 resources.ts / mock/links.ts 中的模拟数据补充为种子数据

-- ============================================================
-- think_tank（智库）: 补充 arXiv、Coursera、MIT OCW
-- ============================================================

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'arXiv', '{"resourceSubModule":"think_tank"}', '', 'https://arxiv.org', '最新 AI / CS 预印本论文', 40, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'arXiv' AND link_url = 'https://arxiv.org');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'Coursera', '{"resourceSubModule":"think_tank"}', '', 'https://www.coursera.org', '顶尖高校在线课程', 50, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'Coursera' AND link_url = 'https://www.coursera.org');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'MIT OCW', '{"resourceSubModule":"think_tank"}', '', 'https://ocw.mit.edu', 'MIT 开放课程', 60, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'MIT OCW' AND link_url = 'https://ocw.mit.edu');

-- ============================================================
-- campus（校园）: 补充 学工系统、后勤服务、外卖点位图
-- ============================================================

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', '学工系统', '{"resourceSubModule":"campus"}', '', '#', '奖助学金与素质测评', 40, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '学工系统');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', '后勤服务', '{"resourceSubModule":"campus"}', '', '#', '报修、校车与一卡通', 50, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '后勤服务');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', '外卖点位图', '{"resourceSubModule":"campus"}', '', '#', '校园外卖集中取餐坐标', 60, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '外卖点位图');

-- ============================================================
-- tools（工具）: 补充 VS Code、Docker Hub、DevDocs.io
-- ============================================================

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'VS Code', '{"resourceSubModule":"tools"}', '', 'https://code.visualstudio.com', '微软开源代码编辑器', 40, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'VS Code' AND link_url = 'https://code.visualstudio.com');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'Docker Hub', '{"resourceSubModule":"tools"}', '', 'https://hub.docker.com', '容器镜像与一键部署', 50, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'Docker Hub' AND link_url = 'https://hub.docker.com');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'DevDocs.io', '{"resourceSubModule":"tools"}', '', 'https://devdocs.io', '多语言开发文档聚合', 60, 1, 'resource_matrix', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'DevDocs.io' AND link_url = 'https://devdocs.io');

-- ============================================================
-- friend_links（友情链接）: 前端 FALLBACK_LINKS 种子数据
-- ============================================================

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'Cooo Wiki 友链页', '', '', 'https://wiki.cooo.site/links', 'Cooo Wiki 友情链接', 1, 1, 'friend_links', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'friend_links' AND title = 'Cooo Wiki 友链页' AND link_url = 'https://wiki.cooo.site/links');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'resource', 'HDU CS Wiki', '', '', 'https://hdu-cs.wiki/', '杭州电子科技大学计算机知识库', 2, 1, 'friend_links', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'friend_links' AND title = 'HDU CS Wiki' AND link_url = 'https://hdu-cs.wiki/');

-- ============================================================
-- mini_games: 补充 贪吃蛇大作战（外部链接）、2048 在线版（外部链接）
-- ============================================================

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, game_type, created_at, updated_at)
SELECT 'resource', '贪吃蛇大作战', '{"gameType":"external","externalUrl":"https://playsnake.org/","embedSupported":false}', '', 'https://playsnake.org/', '在线多人贪吃蛇游戏', 30, 1, 'mini_games', 'external', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'mini_games' AND title = '贪吃蛇大作战' AND link_url = 'https://playsnake.org/');

INSERT INTO nav_items (content_type, title, content, cover_url, link_url, description, sort, active, category, game_type, created_at, updated_at)
SELECT 'resource', '2048 在线版', '{"gameType":"external","externalUrl":"https://play2048.co/","embedSupported":false}', '', 'https://play2048.co/', '经典数字合并益智游戏', 40, 1, 'mini_games', 'external', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'mini_games' AND title = '2048 在线版' AND link_url = 'https://play2048.co/');
