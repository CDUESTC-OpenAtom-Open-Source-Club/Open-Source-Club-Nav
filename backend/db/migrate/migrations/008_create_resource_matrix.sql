-- 008_create_resource_matrix.sql
CREATE TABLE `resource_matrix` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `category` varchar(100) NOT NULL COMMENT '资源分类',
  `name` varchar(255) NOT NULL COMMENT '资源名称',
  `url` varchar(500) NOT NULL COMMENT '资源链接',
  `desc` text COMMENT '资源描述',
  `tag` varchar(200) DEFAULT NULL COMMENT '资源标签',
  PRIMARY KEY (`id`),
  KEY `idx_resource_matrix_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;