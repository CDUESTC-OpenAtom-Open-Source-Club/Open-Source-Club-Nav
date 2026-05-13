import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";

export async function GET() {
  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const [rows] = await pool.query(
    `SELECT stat_date, page_views, unique_visitors, link_clicks
     FROM admin_daily_stats
     ORDER BY stat_date DESC
     LIMIT 30`,
  );
  const list = rows as Array<{
    stat_date: string;
    page_views: number;
    unique_visitors: number;
    link_clicks: number;
  }>;

  const today = list[0] || {
    stat_date: new Date().toISOString().slice(0, 10),
    page_views: 0,
    unique_visitors: 0,
    link_clicks: 0,
  };

  const trend7 = list.slice(0, 7).reverse();

  const [popularRows] = await pool.query(
    `SELECT
       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(detail, '$.url')), '') AS url_value,
       COUNT(*) AS clicks
     FROM admin_link_logs
     WHERE action IN ('create', 'update')
     GROUP BY url_value
     ORDER BY clicks DESC
     LIMIT 10`,
  );
  const popular = (popularRows as Array<{ url_value: string; clicks: number }>)
    .map((r) => {
      let category = "unknown";
      try {
        const host = new URL(r.url_value).host.replace(/^www\./, "");
        category = host || "unknown";
      } catch {}
      return { category, clicks: Number(r.clicks || 0) };
    })
    .reduce<Record<string, number>>((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.clicks;
      return acc;
    }, {});

  const popularCategories = Object.entries(popular)
    .map(([category, clicks]) => ({ category, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 7);

  return Response.json({ today, days: list, trend7, popularCategories });
}
