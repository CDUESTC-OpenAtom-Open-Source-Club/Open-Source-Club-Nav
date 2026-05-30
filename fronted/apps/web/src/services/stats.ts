import pool from "@/lib/db";
import { getMockAdminStats } from "@/data/mock/stats";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const HEALTH_CHECK_TIMEOUT_MS = 5000;

function toRepoLabel(title: string | null, url: string, linkId: number): string {
  const safeTitle = String(title || "").trim();
  if (safeTitle) return safeTitle;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("github.com")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
    }
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return `link#${linkId}`;
  }
}

export async function getAdminStats() {
  if (USE_MOCK) return getMockAdminStats();

  const [rows] = await pool.query(
    "SELECT stat_date, page_views, unique_visitors, link_clicks FROM daily_stats ORDER BY stat_date DESC LIMIT 30"
  );
  const list = rows as Array<{ stat_date: string; page_views: number; unique_visitors: number; link_clicks: number }>;

  const today = list[0] || { stat_date: new Date().toISOString().slice(0, 10), page_views: 0, unique_visitors: 0, link_clicks: 0 };
  const days = [...list].reverse();
  const trend7 = days.slice(-7);
  const [hourlyRows] = await pool.query(
    `SELECT
       HOUR(created_at) AS hour,
       SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END) AS page_views,
       COUNT(DISTINCT CASE WHEN event_type = 'visit' THEN visitor_id ELSE NULL END) AS unique_visitors,
       SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS link_clicks
     FROM metrics
     WHERE created_at >= CURDATE()
       AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
     GROUP BY HOUR(created_at)
     ORDER BY hour ASC`,
  );
  const hourlyMap = new Map(
    (hourlyRows as Array<{ hour: number; page_views: number; unique_visitors: number; link_clicks: number }>).map((item) => [
      Number(item.hour || 0),
      {
        hour: Number(item.hour || 0),
        page_views: Number(item.page_views || 0),
        unique_visitors: Number(item.unique_visitors || 0),
        link_clicks: Number(item.link_clicks || 0),
      },
    ]),
  );
  const hourly24 = Array.from({ length: 24 }).map((_, hour) => {
    const row = hourlyMap.get(hour);
    return row || { hour, page_views: 0, unique_visitors: 0, link_clicks: 0 };
  });

  const [popularRows] = await pool.query(
    `SELECT
       m.nav_item_id AS link_id,
       COALESCE(n.title, m.target_label, m.target_url, CONCAT('item#', COALESCE(m.nav_item_id, 0))) AS title,
       COALESCE(n.link_url, m.target_url, '') AS url,
       COUNT(*) AS clicks
     FROM metrics m
     LEFT JOIN nav_items n ON m.nav_item_id = n.id
     WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND m.event_type = 'click'
       AND (
         m.source_context LIKE 'works-carousel:%'
         OR m.source_context = 'github-work'
       )
       AND COALESCE(m.target_url, '') LIKE 'https://github.com/%'
     GROUP BY
       m.nav_item_id,
       COALESCE(n.title, m.target_label, m.target_url, CONCAT('item#', COALESCE(m.nav_item_id, 0))),
       COALESCE(n.link_url, m.target_url, '')
     ORDER BY clicks DESC
     LIMIT 5`
  );

  const popularBase = (popularRows as Array<{
    link_id: number;
    title: string | null;
    url: string;
    clicks: number;
  }>).map((row) => ({
    repo: toRepoLabel(row.title, row.url, row.link_id),
    sourceUrl: row.url,
    clicks: Number(row.clicks || 0),
  }));

  const popularRepos = await Promise.all(
    popularBase.map(async (row) => {
      const [trendRows] = await pool.query(
        `SELECT
           DATE(m.created_at) AS stat_date,
           COUNT(*) AS clicks
         FROM metrics m
         WHERE m.event_type = 'click'
           AND COALESCE(m.target_url, '') = ?
           AND m.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
           AND (
             m.source_context LIKE 'works-carousel:%'
             OR m.source_context = 'github-work'
           )
         GROUP BY DATE(m.created_at)
         ORDER BY stat_date ASC`,
        [row.sourceUrl],
      );

      const trendMap = new Map(
        (trendRows as Array<{ stat_date: string; clicks: number }>).map((item) => [
          String(item.stat_date).slice(0, 10),
          Number(item.clicks || 0),
        ]),
      );

      const trend7 = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const key = date.toISOString().slice(0, 10);
        return {
          stat_date: key,
          clicks: trendMap.get(key) || 0,
        };
      });

      let isValid: boolean | null = null;
      if (row.sourceUrl) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
        try {
          const res = await fetch(row.sourceUrl, {
            method: "HEAD",
            redirect: "follow",
            signal: controller.signal,
            cache: "no-store",
          });
          isValid = res.ok;
        } catch {
          isValid = false;
        } finally {
          clearTimeout(timer);
        }
      }

      return {
        repo: row.repo,
        url: row.sourceUrl,
        clicks: row.clicks,
        trend7,
        isValid,
      };
    }),
  );

  return { today, days, trend7, hourly24, popularRepos, popularCategories: popularRepos };
}

export async function recordVisit(visitorId: string): Promise<{ newVisitor: boolean }> {
  await pool.query(
    `INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
     VALUES (CURDATE(), 1, 0, 0)
     ON DUPLICATE KEY UPDATE page_views = page_views + 1`,
  );

  await pool.query(
    `INSERT INTO metrics (event_type, visitor_id)
     VALUES ('visit', ?)`,
    [visitorId],
  );

  const [insertResult] = await pool.query(
    "INSERT IGNORE INTO daily_visits (stat_date, visitor_id) VALUES (CURDATE(), ?)",
    [visitorId],
  );
  const newVisitor = (insertResult as { affectedRows: number }).affectedRows > 0;

  if (newVisitor) {
    await pool.query(
      `INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
       VALUES (CURDATE(), 0, 1, 0)
       ON DUPLICATE KEY UPDATE unique_visitors = unique_visitors + 1`,
    );
  }

  return { newVisitor };
}

export async function recordClick(params?: {
  navItemId?: number | null;
  visitorId?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  targetUrl?: string | null;
  targetLabel?: string | null;
  sourceContext?: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
     VALUES (CURDATE(), 0, 0, 1)
     ON DUPLICATE KEY UPDATE link_clicks = link_clicks + 1`,
  );
  await pool.query(
    `INSERT INTO metrics
      (event_type, nav_item_id, target_url, target_label, source_context, visitor_id, page_path, referrer, user_agent)
     VALUES ('click', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params?.navItemId ?? null,
      params?.targetUrl ?? null,
      params?.targetLabel ?? null,
      params?.sourceContext ?? null,
      params?.visitorId ?? null,
      params?.pagePath ?? null,
      params?.referrer ?? null,
      params?.userAgent ?? null,
    ],
  );
}
