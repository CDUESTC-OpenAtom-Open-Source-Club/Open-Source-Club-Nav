CREATE TABLE `articles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL COMMENT '文章分类',
  `title` varchar(200) NOT NULL COMMENT '文章标题',
  `cover_url` varchar(255) DEFAULT '' COMMENT '封面图链接',
  `content` text NOT NULL COMMENT '文章正文',
  `author` varchar(50) NOT NULL COMMENT '作者',
  `status` tinyint DEFAULT '1' COMMENT '1=发布，0=草稿',
  `sort` int DEFAULT '0' COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;