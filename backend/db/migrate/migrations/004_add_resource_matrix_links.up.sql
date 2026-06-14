-- 004_add_resource_matrix_links.up.sql (MySQL)
-- 添加新的资源矩阵链接数据

-- ============================================================
-- 智库新增资源 (think_tank)
-- ============================================================
INSERT IGNORE INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'think_tank', 'Brain', '牛客网', '面试刷题 · 笔试真题', '面试刷题 · 笔试真题', 7, 1, 'resource_matrix', '', 'https://www.nowcoder.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '洛谷', '算法竞赛训练平台', '算法竞赛训练平台', 8, 1, 'resource_matrix', '', 'https://www.luogu.com.cn', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '中国大学MOOC', '国内高校优质课程', '国内高校优质课程', 9, 1, 'resource_matrix', '', 'https://www.icourse163.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'edX', '哈佛MIT等名校课程', '哈佛MIT等名校课程', 10, 1, 'resource_matrix', '', 'https://www.edx.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'Kaggle', '数据科学竞赛平台', '数据科学竞赛平台', 11, 1, 'resource_matrix', '', 'https://www.kaggle.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'W3Schools', 'Web开发入门教程', 'Web开发入门教程', 12, 1, 'resource_matrix', '', 'https://www.w3schools.com', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', 'GeeksforGeeks', '计算机科学知识库', '计算机科学知识库', 13, 1, 'resource_matrix', '', 'https://www.geeksforgeeks.org', NOW(3), NOW(3)),
('resource_matrix', 'think_tank', 'Brain', '菜鸟教程', '编程语言入门指南', '编程语言入门指南', 14, 1, 'resource_matrix', '', 'https://www.runoob.com', NOW(3), NOW(3));

-- ============================================================
-- 校园新增资源 (campus)
-- ============================================================
INSERT IGNORE INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'campus', 'MapPin', '就业信息网', '招聘信息 · 就业指导', '招聘信息 · 就业指导', 7, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '创新创业中心', '创业指导 · 项目孵化', '创业指导 · 项目孵化', 8, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '学术讲座公告', '学术活动 · 讲座信息', '学术活动 · 讲座信息', 9, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '校园地图', '校园导航 · 建筑分布', '校园导航 · 建筑分布', 10, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '校历查询', '学期安排 · 假期时间', '学期安排 · 假期时间', 11, 1, 'resource_matrix', '', '#', NOW(3), NOW(3)),
('resource_matrix', 'campus', 'MapPin', '实验室预约', '实验室使用预约系统', '实验室使用预约系统', 12, 1, 'resource_matrix', '', '#', NOW(3), NOW(3));

-- ============================================================
-- 工具新增资源 (tools)
-- ============================================================
INSERT IGNORE INTO nav_items (content_type, sub_type, icon, title, description, content, sort, active, category, cover_url, link_url, created_at, updated_at) VALUES
('resource_matrix', 'tools', 'Wrench', 'Figma', 'UI/UX设计协作工具', 'UI/UX设计协作工具', 9, 1, 'resource_matrix', '', 'https://www.figma.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Notion', '知识管理与协作平台', '知识管理与协作平台', 10, 1, 'resource_matrix', '', 'https://www.notion.so', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Obsidian', '本地知识管理工具', '本地知识管理工具', 11, 1, 'resource_matrix', '', 'https://obsidian.md', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Typora', '极简Markdown编辑器', '极简Markdown编辑器', 12, 1, 'resource_matrix', '', 'https://typora.io', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Vercel', '前端部署与托管平台', '前端部署与托管平台', 13, 1, 'resource_matrix', '', 'https://vercel.com', NOW(3), NOW(3)),
('resource_matrix', 'tools', 'Wrench', 'Google Fonts', '免费开源字体资源库', '免费开源字体资源库', 14, 1, 'resource_matrix', '', 'https://fonts.google.com', NOW(3), NOW(3));