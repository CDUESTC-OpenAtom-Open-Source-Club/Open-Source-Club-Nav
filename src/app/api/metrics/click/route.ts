import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

export async function POST() {
  try {
    await ensureAdminTables();
    await pool.query(
      `INSERT INTO admin_daily_stats (stat_date, page_views, unique_visitors, link_clicks)
       VALUES (CURDATE(), 0, 0, 1)
       ON DUPLICATE KEY UPDATE link_clicks = link_clicks + 1`,
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
