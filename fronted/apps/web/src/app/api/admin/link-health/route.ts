import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";
import { recordAdminActionLog } from "@/lib/admin-logs";
import { MOCK_HEALTH } from "@/data/mock/health";
import { getAllLinks } from "@/services/links";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const LINK_CHECK_TIMEOUT_MS = 10000;
const LINK_CHECK_CONCURRENCY = 6;
const REALTIME_MIN_INTERVAL_MS = 5000;
const MOCK_REALTIME_INTERVAL_MS = 5000;

type LinkHealthRow = {
  link_id: number;
  url: string;
  status_code: number | null;
  is_ok: number;
  checked_at: string;
  message: string;
  title: string;
};

let mockHealth: LinkHealthRow[] = MOCK_HEALTH.map((item) => ({ ...item }));
let mockLastCheckedAt = 0;
let realtimeCheckInFlight: Promise<{ checked: number; failed: number; at: string }> | null = null;
let lastRealtimeCheckAt = 0;

function refreshMockHealth() {
  const now = Date.now();
  mockHealth = mockHealth.map((item, index) => ({
    ...item,
    checked_at: new Date(now - index * 1800000).toISOString(),
  }));
  return mockHealth;
}

async function probeUrl(url: string): Promise<{
  statusCode: number | null;
  isOk: boolean;
  message: string;
}> {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    return { statusCode: null, isOk: false, message: "empty url" };
  }
  if (normalizedUrl.startsWith("/")) {
    return { statusCode: 200, isOk: true, message: "internal route" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(normalizedUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    const healthy = res.status >= 200 && res.status < 400;
    return {
      statusCode: res.status,
      isOk: healthy,
      message: healthy ? "" : `HTTP ${res.status}`,
    };
  } catch (e) {
    const err = e as Error;
    if (err?.name === "AbortError") {
      return { statusCode: null, isOk: false, message: `timeout ${LINK_CHECK_TIMEOUT_MS}ms` };
    }
    return { statusCode: null, isOk: false, message: String(err?.message || "request failed").slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

async function runMockHealthCheck() {
  const links = await getAllLinks();
  const activeLinks = links.filter((item) => Number(item.active ?? 1) === 1);
  const list = await Promise.all(activeLinks.map(async (link) => {
    const result = await probeUrl(String(link.url || ""));
    return {
      link_id: Number(link.id),
      title: String(link.title || `#${link.id}`),
      url: String(link.url || ""),
      status_code: result.statusCode,
      is_ok: result.isOk ? 1 : 0,
      checked_at: new Date().toISOString(),
      message: result.message,
    } satisfies LinkHealthRow;
  }));
  mockHealth = list;
  mockLastCheckedAt = Date.now();
  return {
    checked: list.length,
    failed: list.filter((item) => !item.is_ok).length,
    at: new Date().toISOString(),
    health: list,
  };
}

export async function GET() {
  if (USE_MOCK) {
    if (!mockHealth.length || Date.now() - mockLastCheckedAt >= MOCK_REALTIME_INTERVAL_MS) {
      await runMockHealthCheck();
    }
    return Response.json({ health: mockHealth, refreshed_at: new Date().toISOString(), source: "mock_probe" });
  }

  try {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) return Response.json({ error: "未登录" }, { status: 401 });
    if (session.role !== "editor" && session.role !== "super") {
      return Response.json({ error: "无权限" }, { status: 403 });
    }
    await runHealthCheck({
      session,
      force: false,
      writeLog: false,
      reason: "realtime_poll",
    });

    const [rows] = await pool.query(
      `SELECT h.nav_item_id AS link_id, h.url, h.status_code, h.is_ok, h.checked_at, h.message, h.response_time_ms, n.title
       FROM nav_item_health h
       LEFT JOIN nav_items n ON n.id = h.nav_item_id
       ORDER BY h.checked_at DESC
       LIMIT 200`,
    );
    return Response.json({ health: rows, refreshed_at: new Date(lastRealtimeCheckAt || Date.now()).toISOString() });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/link-health] GET fallback mock:", (error as Error)?.message || error);
      return Response.json({ health: refreshMockHealth(), refreshed_at: new Date().toISOString() });
    }
    throw error;
  }
}

export async function POST() {
  if (USE_MOCK) {
    const summary = await runMockHealthCheck();
    return Response.json({
      ok: true,
      checked: summary.checked,
      failed: summary.failed,
      refreshed_at: summary.at,
      health: summary.health,
      source: "mock_probe",
    });
  }

  try {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) return Response.json({ error: "未登录" }, { status: 401 });
    if (session.role !== "editor" && session.role !== "super") {
      return Response.json({ error: "无权限" }, { status: 403 });
    }
    const summary = await runHealthCheck({
      session,
      force: true,
      writeLog: true,
      reason: "manual_probe",
    });
    return Response.json({ ok: true, checked: summary.checked, failed: summary.failed, refreshed_at: summary.at });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/link-health] POST fallback mock:", (error as Error)?.message || error);
      const health = refreshMockHealth();
      return Response.json({ ok: true, checked: health.length, health });
    }
    throw error;
  }
}

async function listActiveLinks() {
  const [links] = await pool.query(
    "SELECT id, link_url AS url FROM nav_items WHERE active = 1 ORDER BY id ASC",
  );
  return links as Array<{ id: number; url: string }>;
}

async function checkOneLink(link: { id: number; url: string }) {
  const normalizedUrl = String(link.url || "").trim();
  if (!normalizedUrl) {
    await pool.query(
      `INSERT INTO nav_item_health (nav_item_id, url, status_code, is_ok, checked_at, message, response_time_ms)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE
         url = VALUES(url),
         status_code = VALUES(status_code),
         is_ok = VALUES(is_ok),
         checked_at = VALUES(checked_at),
         message = VALUES(message),
         response_time_ms = VALUES(response_time_ms)`,
      [link.id, normalizedUrl, null, 0, "empty url", null],
    );
    return { isOk: false };
  }

  if (normalizedUrl.startsWith("/")) {
    await pool.query(
      `INSERT INTO nav_item_health (nav_item_id, url, status_code, is_ok, checked_at, message, response_time_ms)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE
         url = VALUES(url),
         status_code = VALUES(status_code),
         is_ok = VALUES(is_ok),
         checked_at = VALUES(checked_at),
         message = VALUES(message),
         response_time_ms = VALUES(response_time_ms)`,
      [link.id, normalizedUrl, 200, 1, "internal route", 0],
    );
    return { isOk: true };
  }

  const startedAt = Date.now();
  const result = await probeUrl(normalizedUrl);
  const responseTimeMs = Math.max(0, Date.now() - startedAt);
  const statusCode = result.statusCode;
  const isOk = result.isOk ? 1 : 0;
  const message = result.message;

  await pool.query(
    `INSERT INTO nav_item_health (nav_item_id, url, status_code, is_ok, checked_at, message, response_time_ms)
     VALUES (?, ?, ?, ?, NOW(), ?, ?)
     ON DUPLICATE KEY UPDATE
       url = VALUES(url),
       status_code = VALUES(status_code),
       is_ok = VALUES(is_ok),
       checked_at = VALUES(checked_at),
       message = VALUES(message),
       response_time_ms = VALUES(response_time_ms)`,
    [link.id, normalizedUrl, statusCode, isOk, message, responseTimeMs],
  );
  return { isOk: Boolean(isOk) };
}

async function runHealthCheck(params: {
  session: { userId: number; username: string; role: "super" | "editor" };
  force: boolean;
  writeLog: boolean;
  reason: string;
}) {
  const now = Date.now();
  if (!params.force && now - lastRealtimeCheckAt < REALTIME_MIN_INTERVAL_MS) {
    return { checked: 0, failed: 0, at: new Date(lastRealtimeCheckAt).toISOString() };
  }
  if (realtimeCheckInFlight) {
    return realtimeCheckInFlight;
  }

  realtimeCheckInFlight = (async () => {
    const list = await listActiveLinks();
    let failed = 0;
    const workers = Array.from({
      length: Math.max(1, Math.min(LINK_CHECK_CONCURRENCY, list.length || 1)),
    }).map(async (_v, workerIndex) => {
      for (let i = workerIndex; i < list.length; i += Math.max(1, LINK_CHECK_CONCURRENCY)) {
        const result = await checkOneLink(list[i]);
        if (!result.isOk) failed += 1;
      }
    });
    await Promise.all(workers);
    const at = new Date().toISOString();
    lastRealtimeCheckAt = Date.now();

    if (params.writeLog) {
      await recordAdminActionLog({
        actor: params.session,
        action: "health_check",
        navItemId: null,
        detail: {
          reason: params.reason,
          checked: list.length,
          failed,
          checked_at: at,
        },
      });
    }

    return { checked: list.length, failed, at };
  })();
  try {
    return await realtimeCheckInFlight;
  } finally {
    realtimeCheckInFlight = null;
  }
}
