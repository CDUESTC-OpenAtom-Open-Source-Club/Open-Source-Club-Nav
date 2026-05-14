import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const mockHealth = [
  { link_id: 1, url: "https://openatom.cn", status_code: 200, is_ok: 1, checked_at: new Date().toISOString(), message: "", title: "OpenAtom Docs" },
  { link_id: 2, url: "https://github.com", status_code: 200, is_ok: 1, checked_at: new Date(Date.now() - 1800000).toISOString(), message: "", title: "GitHub" },
  { link_id: 3, url: "https://nextjs.org", status_code: 503, is_ok: 0, checked_at: new Date(Date.now() - 5400000).toISOString(), message: "HTTP 503", title: "Next.js" },
];

export async function GET() {
  // 列表接口给后台表格使用，只负责展示最近检测结果。
  if (USE_MOCK) {
    return Response.json({ health: mockHealth });
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const [rows] = await pool.query(
    `SELECT h.link_id, h.url, h.status_code, h.is_ok, h.checked_at, h.message, f.title
     FROM admin_link_health h
     LEFT JOIN friend_links f ON f.id = h.link_id
     ORDER BY h.checked_at DESC
     LIMIT 200`,
  );
  return Response.json({ health: rows });
}

export async function POST() {
  // POST 会主动触发一次检测，并把结果写回健康表。
  if (USE_MOCK) {
    return Response.json({ ok: true, checked: mockHealth.length });
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  // 只检查当前启用中的链接，避免无效数据反复探测。
  const [links] = await pool.query(
    "SELECT id, url FROM friend_links WHERE active = 1 ORDER BY id ASC",
  );
  const list = links as Array<{ id: number; url: string }>;
  for (const link of list) {
    let statusCode: number | null = null;
    let isOk = 0;
    let message = "";
    try {
      const res = await fetch(link.url, { method: "HEAD", redirect: "follow" });
      statusCode = res.status;
      isOk = res.ok ? 1 : 0;
      if (!res.ok) message = `HTTP ${res.status}`;
    } catch (e) {
      message = String((e as Error).message || "request failed").slice(0, 200);
    }

    await pool.query(
      `INSERT INTO admin_link_health (link_id, url, status_code, is_ok, checked_at, message)
       VALUES (?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         url = VALUES(url),
         status_code = VALUES(status_code),
         is_ok = VALUES(is_ok),
         checked_at = VALUES(checked_at),
         message = VALUES(message)`,
      [link.id, link.url, statusCode, isOk, message],
    );
  }

  return Response.json({ ok: true, checked: list.length });
}

