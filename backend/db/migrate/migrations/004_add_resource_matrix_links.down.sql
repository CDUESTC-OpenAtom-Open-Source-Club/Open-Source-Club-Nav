-- 004_add_resource_matrix_links.down.sql (MySQL)
-- 回滚新增的资源矩阵链接数据

-- ============================================================
-- 删除智库新增资源
-- ============================================================
DELETE FROM nav_items WHERE content_type = 'resource_matrix' AND sub_type = 'think_tank' AND title IN (
  '牛客网', '洛谷', '中国大学MOOC', 'edX', 'Kaggle', 'W3Schools', 'GeeksforGeeks', '菜鸟教程'
);

-- ============================================================
-- 删除校园新增资源
-- ============================================================
DELETE FROM nav_items WHERE content_type = 'resource_matrix' AND sub_type = 'campus' AND title IN (
  '就业信息网', '创新创业中心', '学术讲座公告', '校园地图', '校历查询', '实验室预约'
);

-- ============================================================
-- 删除工具新增资源
-- ============================================================
DELETE FROM nav_items WHERE content_type = 'resource_matrix' AND sub_type = 'tools' AND title IN (
  'Figma', 'Notion', 'Obsidian', 'Typora', 'Vercel', 'Google Fonts'
);