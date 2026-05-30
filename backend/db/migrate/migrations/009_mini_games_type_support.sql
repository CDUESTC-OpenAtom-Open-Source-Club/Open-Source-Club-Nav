-- 009_mini_games_type_support.sql
-- 小游戏模块增强：支持内置游戏 + 外部链接游戏两种类型

-- 1. 新增 game_type 字段：区分内置(internal) / 外部(external)
ALTER TABLE nav_items
  ADD COLUMN game_type VARCHAR(16) NULL COMMENT '游戏类型: internal=内置, external=外部' AFTER category;

-- 2. 为游戏类型创建索引
CREATE INDEX idx_nav_items_game_type ON nav_items(game_type);

-- 3. game_type 字段说明:
--   - NULL: 非游戏模块的普通条目（resource_matrix / friend_links）
--   - 'internal': 内置游戏（站内自己开发的游戏，link_url 存站内路由如 /games）
--   - 'external': 外部游戏（引入的外部链接游戏，link_url 存完整外部 URL）

-- 4. content 字段 JSON 结构定义（仅 game_type 非空时使用）:
--   内置游戏: {"gameEngine":"pacman|snake|2048|tetris","gameRoute":"/games","description":"..."}
--   外部游戏: {"externalUrl":"https://...","embedSupported":true,"description":"...","previewUrl":"..."}

-- 5. 将现有的内置游戏记录标记为 internal
UPDATE nav_items
  SET game_type = 'internal'
  WHERE category = 'mini_games'
    AND (link_url LIKE '/%' OR link_url LIKE '%/games%');

-- 6. 插入示例外部游戏数据
INSERT INTO nav_items (content_type, sub_type, title, content, description, cover_url, link_url, sort, active, icon, category, game_type, created_at, updated_at)
VALUES
  ('resource', NULL, '贪吃蛇大作战', '{"externalUrl":"https://playsnake.org/","embedSupported":true,"description":"经典贪吃蛇多人对战版"}', '在线多人贪吃蛇游戏', '', 'https://playsnake.org/', 2, 1, 'Gamepad2', 'mini_games', 'external', NOW(3), NOW(3)),
  ('resource', NULL, '2048 在线版', '{"externalUrl":"https://play2048.co/","embedSupported":false,"description":"经典2048数字合并游戏"}', '经典数字合并益智游戏', '', 'https://play2048.co/', 3, 1, 'Grid3X3', 'mini_games', 'external', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  updated_at = NOW(3);
