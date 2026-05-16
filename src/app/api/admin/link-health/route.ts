import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const LINK_CHECK_TIMEOUT_MS = 10000;
const LINK_CHECK_CONCURRENCY = 6;

type LinkHealthRow = {
  link_id: number;
  url: string;
  status_code: number | null;
  is_ok: number;
  checked_at: string;
  message: string;
  title: string;
};

let mockHealth: LinkHealthRow[] = [
  {
    link_id: 1,
    url: "https://openatom.cn",
    status_code: 200,
    is_ok: 1,
    checked_at: new Date().toISOString(),
    message: "",
    title: "OpenAtom Docs",
  },
  {
    link_id: 2,
    url: "https://github.com",
    status_code: 200,
    is_ok: 1,
    checked_at: new Date(Date.now() - 1800000).toISOString(),
    message: "",
    title: "GitHub",
  },
  {
    link_id: 3,
    url: "https://nextjs.org",
    status_code: 503,
    is_ok: 0,
    checked_at: new Date(Date.now() - 5400000).toISOString(),
    message: "HTTP 503",
    title: "Next.js",
  },
];

function refreshMockHealth() {
  const now = Date.now();
  mockHealth = mockHealth.map((item, index) => ({
    ...item,
    checked_at: new Date(now - index * 1800000).toISOString(),
  }));
  return mockHealth;
}

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
    const health = refreshMockHealth();
    return Response.json({ ok: true, checked: health.length, health });
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  // 只检查当前启用中的链接，避免无效数据反复探测。
  const [links] = await pool.query(
    "SELECT id, url FROM friend_links WHERE active = 1 ORDER BY id ASC",
  );
  const list = links as Array<{ id: number; url: string }>;

  const checkOneLink = async (link: { id: number; url: string }) => {
    let statusCode: number | null = null;
    let isOk = 0;
    let message = "";
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, LINK_CHECK_TIMEOUT_MS);

    try {
      const res = await fetch(link.url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      statusCode = res.status;
      isOk = res.ok ? 1 : 0;
      if (!res.ok) message = `HTTP ${res.status}`;
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        message = `timeout ${LINK_CHECK_TIMEOUT_MS}ms`;
      } else {
        message = String(err?.message || "request failed").slice(0, 200);
      }
    } finally {
      clearTimeout(timer);
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
  };

  // 限流并发检测，避免大量链接时串行等待过久。
  const workers = Array.from({
    length: Math.max(1, Math.min(LINK_CHECK_CONCURRENCY, list.length || 1)),
  }).map(async (_v, workerIndex) => {
    for (let i = workerIndex; i < list.length; i += Math.max(1, LINK_CHECK_CONCURRENCY)) {
      await checkOneLink(list[i]);
    }
  });
  await Promise.all(workers);

  // for (const link of list) {
  //   await checkOneLink(link);
  // }

  return Response.json({ ok: true, checked: list.length });
}
