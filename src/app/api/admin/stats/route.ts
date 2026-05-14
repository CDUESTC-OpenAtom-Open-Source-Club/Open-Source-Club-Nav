import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  // mock 模式下返回固定趋势和热门分类，方便后台图表调试。
  if (USE_MOCK) {
    const today = {
      stat_date: new Date().toISOString().slice(0, 10),
      page_views: 1280,
      unique_visitors: 426,
      link_clicks: 318,
    };
    const trend7 = Array.from({ length: 7 }).map((_, index) => ({
      stat_date: new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10),
      link_clicks: [26, 32, 28, 41, 36, 52, 49][index],
    }));
    const days = trend7.map((item, index) => ({
      stat_date: item.stat_date,
      page_views: [980, 1040, 1012, 1188, 1210, 1302, 1280][index],
      unique_visitors: [318, 336, 322, 374, 388, 420, 426][index],
      link_clicks: item.link_clicks,
    })).reverse();
    const popularCategories = [
      { category: "github.com", clicks: 52 },
      { category: "openatom.cn", clicks: 37 },
      { category: "nextjs.org", clicks: 26 },
      { category: "react.dev", clicks: 22 },
      { category: "nodejs.org", clicks: 18 },
    ];

    return Response.json({ today, days, trend7, popularCategories });
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  // 后台统计默认读取最近 30 天，并在页面上拆成 today / trend7 / popular 三部分使用。
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

  // 热门分类这里复用了后台日志中的 URL 信息，再按域名聚合成分类热度。
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

