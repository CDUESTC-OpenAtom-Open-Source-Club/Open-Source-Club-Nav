CREATE TABLE `mini_games` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `game_type` varchar(50) NOT NULL COMMENT '游戏类型',
  `name` varchar(100) NOT NULL COMMENT '游戏名称',
  `cover_url` varchar(255) DEFAULT '' COMMENT '封面图链接',
  `play_url` varchar(255) NOT NULL COMMENT '游玩链接',
  `status` tinyint DEFAULT '1' COMMENT '1=上线，0=下线',
  `sort` int DEFAULT '0' COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;