import pool from "@/lib/db";
import { getMockAdminStats } from "@/data/mock/stats";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function getAdminStats() {
  if (USE_MOCK) return getMockAdminStats();

  const [rows] = await pool.query(
    "SELECT stat_date, page_views, unique_visitors, link_clicks FROM admin_daily_stats ORDER BY stat_date DESC LIMIT 30"
  );
  const list = rows as Array<{ stat_date: string; page_views: number; unique_visitors: number; link_clicks: number }>;

  const today = list[0] || { stat_date: new Date().toISOString().slice(0, 10), page_views: 0, unique_visitors: 0, link_clicks: 0 };
  const days = [...list].reverse();
  const trend7 = days.slice(-7);

  const [popularRows] = await pool.query(
    `SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(f.url, '/', 3), '://', -1) AS category, COUNT(*) AS clicks
     FROM metrics m JOIN friend_links f ON m.link_id = f.id
     WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY category ORDER BY clicks DESC LIMIT 5`
  );

  return { today, days, trend7, popularCategories: popularRows };
}

export async function recordVisit(visitorId: string): Promise<{ newVisitor: boolean }> {
  await pool.query(
    `INSERT INTO admin_daily_stats (stat_date, page_views, unique_visitors, link_clicks)
     VALUES (CURDATE(), 1, 0, 0)
     ON DUPLICATE KEY UPDATE page_views = page_views + 1`,
  );

  const [insertResult] = await pool.query(
    "INSERT IGNORE INTO admin_daily_visits (stat_date, visitor_id) VALUES (CURDATE(), ?)",
    [visitorId],
  );
  const newVisitor = (insertResult as { affectedRows: number }).affectedRows > 0;

  if (newVisitor) {
    await pool.query(
      `INSERT INTO admin_daily_stats (stat_date, page_views, unique_visitors, link_clicks)
       VALUES (CURDATE(), 0, 1, 0)
       ON DUPLICATE KEY UPDATE unique_visitors = unique_visitors + 1`,
    );
  }

  return { newVisitor };
}

export async function recordClick(): Promise<void> {
  await pool.query(
    `INSERT INTO admin_daily_stats (stat_date, page_views, unique_visitors, link_clicks)
     VALUES (CURDATE(), 0, 0, 1)
     ON DUPLICATE KEY UPDATE link_clicks = link_clicks + 1`,
  );
}
