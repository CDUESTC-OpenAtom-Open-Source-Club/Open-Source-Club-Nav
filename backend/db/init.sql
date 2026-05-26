CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  deleted_at DATETIME(3) NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_users_username (username),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nav_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  cover_url VARCHAR(500) NOT NULL DEFAULT '',
  link_url VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_nav_items_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS misc (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  other JSON NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (email, password_hash, role, created_at, updated_at, username, password)
VALUES
  ('admin@example.com', '', 'admin', NOW(3), NOW(3), 'admin', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHeU2aLsvWfHMX1wzO43SAcP5sq9erT7eK')
ON DUPLICATE KEY UPDATE role = VALUES(role), updated_at = NOW(3);

INSERT INTO nav_items (title, content, cover_url, link_url, created_at, updated_at)
VALUES
  ('GitHub', '代码托管与开源协作平台', '', 'https://github.com', NOW(3), NOW(3)),
  ('OpenAtom', '开放原子开源基金会', '', 'https://www.openatom.org/', NOW(3), NOW(3)),
  ('KCOS Club', '科成开放原子开源社团', '', 'https://opensouce-club.top/', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updated_at = NOW(3);
