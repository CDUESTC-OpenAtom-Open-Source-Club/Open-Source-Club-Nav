INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'CS 自学路线图', '{"resourceSubModule":"think_tank"}', '', 'https://roadmap.sh/computer-science', '完整计算机科学自学路径', 10, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'CS 自学路线图' AND link_url = 'https://roadmap.sh/computer-science');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'LeetCode', '{"resourceSubModule":"think_tank"}', '', 'https://leetcode.cn', '算法刷题与面试准备', 20, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'LeetCode' AND link_url = 'https://leetcode.cn');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '知网 CNKI', '{"resourceSubModule":"think_tank"}', '', 'https://www.cnki.net', '中文学术论文数据库', 30, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '知网 CNKI' AND link_url = 'https://www.cnki.net');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '教务处系统', '{"resourceSubModule":"campus"}', '', '#', '成绩查询、选课与教务公告', 10, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '教务处系统');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '图书馆资源', '{"resourceSubModule":"campus"}', '', '#', '电子书、数据库与空间预约', 20, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '图书馆资源');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '校园卡服务', '{"resourceSubModule":"campus"}', '', '#', '余额查询、挂失与充值', 30, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '校园卡服务');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'GitHub', '{"resourceSubModule":"tools"}', '', 'https://github.com', '代码托管与开源协作平台', 10, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'GitHub' AND link_url = 'https://github.com');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '清华开源镜像站', '{"resourceSubModule":"tools"}', '', 'https://mirrors.tuna.tsinghua.edu.cn', '国内高速软件下载镜像', 20, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = '清华开源镜像站');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT 'MDN Web Docs', '{"resourceSubModule":"tools"}', '', 'https://developer.mozilla.org', '前端开发权威参考文档', 30, 1, 'resource_matrix', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'resource_matrix' AND title = 'MDN Web Docs');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '吃豆人小游戏', '{"gameType":"internal","gameRoute":"/games","embedSupported":true}', '', '/games', '站内经典小游戏入口', 10, 1, 'mini_games', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'mini_games' AND title = '吃豆人小游戏');

INSERT INTO nav_items (title, content, cover_url, link_url, description, sort, active, category, created_at, updated_at)
SELECT '2048', '{"gameType":"internal","gameRoute":"/games","embedSupported":true}', '', '/games', '站内 2048 小游戏入口', 20, 1, 'mini_games', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE category = 'mini_games' AND title = '2048');

INSERT INTO works (type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, preview_url, is_featured, display_order, created_at, updated_at)
SELECT 'MANUAL', NULL, '选课助手 Pro', '自动抢课、冲突检测与课表可视化', 'KCOS Team', 'KT', JSON_ARRAY('React', 'Python', 'FastAPI'), '#0A84FF', '已上线', 128, NULL, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM works WHERE title = '选课助手 Pro');

INSERT INTO works (type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, preview_url, is_featured, display_order, created_at, updated_at)
SELECT 'MANUAL', NULL, '校园外卖比价器', '实时比价、拼单功能与历史价格趋势', 'KCOS Team', 'KT', JSON_ARRAY('Vue3', 'Node.js', 'Redis'), '#06E5CC', '开发中', 87, NULL, 1, 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM works WHERE title = '校园外卖比价器');

INSERT INTO works (type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, preview_url, is_featured, display_order, created_at, updated_at)
SELECT 'MANUAL', NULL, '开源贡献看板', '社团成员贡献可视化与 GitHub Stats 聚合', 'KCOS Team', 'KT', JSON_ARRAY('D3.js', 'GitHub API', 'Next.js'), '#EC4899', '已上线', 143, NULL, 1, 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM works WHERE title = '开源贡献看板');
