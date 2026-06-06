
INSERT INTO users (email, password_hash, role, created_at, updated_at, username)
VALUES
  ('admin@example.com', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHeU2aLsvWfHMX1wzO43SAcP5sq9erT7eK', 'admin', NOW(3), NOW(3), 'admin')
-- 修改后（简化）
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  updated_at = NOW(3);

INSERT INTO nav_items (title, content, cover_url, link_url, created_at, updated_at)
VALUES
  ('GitHub', '代码托管与开源协作平台', '', 'https://github.com', NOW(3), NOW(3)),
  ('OpenAtom', '开放原子开源基金会', '', 'https://www.openatom.org/', NOW(3), NOW(3)),
  ('KCOS Club', '科成开放原子开源社团', '', 'https://opensouce-club.top/', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  updated_at = NOW(3);
