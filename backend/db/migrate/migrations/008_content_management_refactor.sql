-- 008_content_management_refactor.sql
-- 内容管理重构：支持前端三个板块的数据统一管理

-- 1. 为 nav_items 添加内容类型分类字段
ALTER TABLE nav_items
  ADD COLUMN content_type VARCHAR(32) NOT NULL DEFAULT 'resource' AFTER id,
  ADD COLUMN sub_type VARCHAR(64) NULL AFTER content_type,
  ADD COLUMN icon VARCHAR(32) NULL AFTER sub_type;

-- 2. 创建内容分类索引
CREATE INDEX idx_nav_items_content_type ON nav_items(content_type);
CREATE INDEX idx_nav_items_sub_type ON nav_items(sub_type);
CREATE INDEX idx_nav_items_type_sub ON nav_items(content_type, sub_type);

-- 3. 内容类型定义
-- content_type 可能的值:
-- - 'resource': 资料分类（对应前端"资料分类"）
-- - 'official_news': 官网最新文章

-- 4. sub_type 可能的值（当 content_type = 'resource' 时）:
-- - 'learning_material': 学习资料
-- - 'open_source': 开源项目
-- - 'tech_articles': 技术文章
-- - 'activity_review': 活动回顾
-- - 'tools': 工具推荐

-- 5. 初始化示例数据
INSERT INTO nav_items (content_type, sub_type, title, content, description, cover_url, link_url, sort, active, icon, created_at, updated_at)
VALUES
  -- 资料分类 - 学习资料
  ('resource', 'learning_material', 'Git 入门指南', '版本控制基础教程', '版本控制基础教程', '', 'https://git-scm.com/doc', 1, 1, 'BookOpen', NOW(3), NOW(3)),
  ('resource', 'learning_material', 'Linux 常用命令', '终端操作速查手册', '终端操作速查手册', '', 'https://linux.die.net/man/', 2, 1, 'Terminal', NOW(3), NOW(3)),
  ('resource', 'learning_material', '数据结构与算法', '配套练习题资源', '配套练习题资源', '', 'https://leetcode.cn/', 3, 1, 'Code', NOW(3), NOW(3)),

  -- 资料分类 - 开源项目
  ('resource', 'open_source', '社团官网源码', 'OpenAtom Club 官网源码', 'OpenAtom Club 官网源码', '', 'https://github.com/CDUESTC-OpenAtom-Open-Source-Club/Open-Source-Club-Nav', 1, 1, 'Github', NOW(3), NOW(3)),
  ('resource', 'open_source', '自动化签到脚本', '校园网自动签到工具', '校园网自动签到工具', '', 'https://github.com/example/auto-checkin', 2, 1, 'Clock', NOW(3), NOW(3)),
  ('resource', 'open_source', '开源贡献指引', '如何给开源项目 PR', '开源贡献指南', '', 'https://docs.github.com/cn/get-started/exploring-projects-on-github', 3, 1, 'GitPullRequest', NOW(3), NOW(3)),

  -- 资料分类 - 技术文章
  ('resource', 'tech_articles', '浅谈前后端分离', '架构设计入门', '前后端分离架构设计', '', '#', 1, 1, 'FileText', NOW(3), NOW(3)),
  ('resource', 'tech_articles', 'Docker 容器化实践', '部署环境一键搭建', 'Docker 容器化最佳实践', '', '#', 2, 1, 'Container', NOW(3), NOW(3)),
  ('resource', 'tech_articles', 'API 设计', '接口规范与最佳实践', 'RESTful API 设计指南', '', '#', 3, 1, 'Settings', NOW(3), NOW(3)),

  -- 资料分类 - 活动回顾
  ('resource', 'activity_review', '2026 Q1 活动回顾', '优秀文章回顾', '2026 年第一季度社团活动回顾', '', '#', 1, 1, 'Calendar', NOW(3), NOW(3)),
  ('resource', 'activity_review', '新生见面会', '2026 秋季纳新', '2026 年秋季新生见面会回顾', '', '#', 2, 1, 'Users', NOW(3), NOW(3)),
  ('resource', 'activity_review', '社团换届', '2026 社团换届', '2026 年社团换届活动回顾', '', '#', 3, 1, 'RefreshCw', NOW(3), NOW(3)),

  -- 资料分类 - 工具推荐
  ('resource', 'tools', 'VS Code 插件合集', '效率提升必备', 'VS Code 高效开发插件推荐', '', 'https://marketplace.visualstudio.com/vscode', 1, 1, 'Wrench', NOW(3), NOW(3)),
  ('resource', 'tools', 'AI 工具推荐', '现代编程必备', 'AI 辅助编程工具合集', '', '#', 2, 1, 'Bot', NOW(3), NOW(3)),
  ('resource', 'tools', '在线工具箱', '快速查询工具', '开发者常用在线工具', '', '#', 3, 1, 'Globe', NOW(3), NOW(3)),

  -- 官网最新文章
  ('official_news', NULL, 'OpenAtom 开放原子开源基金会', '开放原子开源基金会简介', '开放原子开源基金会致力于开源项目的推广和发展', '', 'https://www.openatom.org/', 1, 1, 'Newspaper', NOW(3), NOW(3)),
  ('official_news', NULL, 'KCOS Club 招新公告', '2026 秋季纳新启动', '加入 KCOS Club，探索开源世界', '', 'https://opensouce-club.top/', 2, 1, 'Bell', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  content_type = VALUES(content_type),
  sub_type = VALUES(sub_type),
  updated_at = NOW(3);