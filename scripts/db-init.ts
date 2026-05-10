// 一键初始化数据库脚本
// 使用方式: npx tsx scripts/db-init.ts

import mysql from "mysql2/promise";

async function main() {
  const host = process.env.MYSQL_HOST || "localhost";
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD || "";

  console.log(`[db-init] 连接 MySQL ${host}:${port} ...`);

  // 先不指定数据库，用于创建数据库
  const conn = await mysql.createConnection({ host, port, user, password });

  console.log("[db-init] 创建数据库 kcos_nav ...");
  await conn.query("CREATE DATABASE IF NOT EXISTS kcos_nav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  await conn.query("USE kcos_nav");

  console.log("[db-init] 创建表 friend_links ...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS friend_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      url VARCHAR(500) NOT NULL,
      description VARCHAR(255) DEFAULT '',
      sort INT DEFAULT 0,
      active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active_sort (active, sort)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 检查是否已有数据
  const [rows] = await conn.query("SELECT COUNT(*) as cnt FROM friend_links");
  const cnt = (rows as { cnt: number }[])[0].cnt;

  if (cnt === 0) {
    console.log("[db-init] 插入初始友链数据 ...");
    await conn.query(`
      INSERT INTO friend_links (title, url, description, sort, active) VALUES
      ('Cooo Wiki 友链页', 'https://wiki.cooo.site/links', 'Cooo Wiki 友情链接', 1, 1),
      ('HDU CS Wiki', 'https://hdu-cs.wiki/', '杭电计算机知识库', 2, 1)
    `);
  }

  // ============ works 表 ============
  console.log("[db-init] 创建表 works ...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS works (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('GITHUB', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
      repo_url VARCHAR(500) DEFAULT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      author_name VARCHAR(100) NOT NULL DEFAULT '',
      author_avatar VARCHAR(255) DEFAULT '',
      tags JSON,
      color VARCHAR(20) DEFAULT '#0A84FF',
      status VARCHAR(50) DEFAULT '开发中',
      stars INT DEFAULT 0,
      preview_url VARCHAR(500) DEFAULT NULL,
      is_featured TINYINT(1) DEFAULT 1,
      display_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_repo_url (repo_url),
      INDEX idx_featured_order (is_featured, display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [worksRows] = await conn.query("SELECT COUNT(*) as cnt FROM works");
  const worksCnt = (worksRows as { cnt: number }[])[0].cnt;

  if (worksCnt === 0) {
    console.log("[db-init] 插入初始作品数据 ...");
    await conn.query(`
      INSERT INTO works (type, repo_url, title, description, author_name, author_avatar, tags, color, status, stars, is_featured, display_order) VALUES
      ('MANUAL', NULL, '选课助手 Pro', '自动抢课 · 冲突检测 · 课表可视化', 'Zhang Wei', 'ZW', '["React","Python","FastAPI"]', '#0A84FF', '已上线', 128, 1, 1),
      ('MANUAL', NULL, '校园外卖比价器', '实时比价 · 拼单功能 · 历史价格趋势', 'Liu Fang', 'LF', '["Vue3","Node.js","Redis"]', '#06E5CC', '开发中', 87, 1, 2),
      ('MANUAL', NULL, '摸鱼时钟', '番茄钟 · 任务追踪 · 团队协作看板', 'Chen Hao', 'CH', '["TypeScript","Prisma","WebSocket"]', '#7C3AED', '已上线', 203, 1, 3),
      ('MANUAL', NULL, 'OpenAI 实验室', '大模型 Prompt 调试 · 对话记录云端同步', 'Wang Jing', 'WJ', '["Next.js","OpenAI API","Supabase"]', '#F59E0B', '内测中', 156, 1, 4),
      ('MANUAL', NULL, '成电路线导航', '室内导航 · 空教室查询 · 一键打印路线', 'Li Ming', 'LM', '["Flutter","Go","PostgreSQL"]', '#EF4444', '已上线', 94, 1, 5),
      ('MANUAL', NULL, 'HexBoard', '极简六边形笔记板 · Markdown · 本地优先', 'Zhao Yu', 'ZY', '["Electron","SQLite","ProseMirror"]', '#10B981', '已上线', 312, 1, 6),
      ('MANUAL', NULL, 'StarLink CLI', 'Git 工作流工具 · 自动化提交规范', 'Sun Lei', 'SL', '["Rust","CLI","Shell"]', '#38BDF8', '开发中', 67, 1, 7),
      ('MANUAL', NULL, '开源贡献看板', '社团成员贡献可视化 · GitHub Stats', 'Huang Xin', 'HX', '["D3.js","GitHub API","Vercel"]', '#EC4899', '已上线', 143, 1, 8)
    `);
  }

  await conn.end();
  console.log("[db-init] ✅ 数据库初始化完成！");
}

main().catch((err) => {
  console.error("[db-init] ❌ 初始化失败:", err.message);
  process.exit(1);
});
