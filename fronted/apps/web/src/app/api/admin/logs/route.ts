import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import pool from "@/lib/db";
import { listMockAdminActionLogs } from "@/lib/admin-logs";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

function parseLimit(value: string | null): number {
  const n = Number(value || 200);
  if (!Number.isFinite(n) || n <= 0) return 200;
  return Math.max(1, Math.min(500, Math.floor(n)));
}

function parseJsonDetail(detail: unknown): unknown {
  if (detail === null || detail === undefined) return null;
  if (typeof detail === "string") {
    try {
      return JSON.parse(detail);
    } catch {
      return detail;
    }
  }
  return detail;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));

  if (USE_MOCK) {
    return Response.json({ logs: listMockAdminActionLogs(limit) });
  }

  try {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) return Response.json({ error: "未登录" }, { status: 401 });
    if (session.role !== "super" && session.role !== "editor") {
      return Response.json({ error: "无权限" }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT
         l.id,
         l.nav_item_id AS link_id,
         l.action,
         l.actor_username,
         l.actor_role,
         l.created_at,
         l.detail,
         n.title AS link_title
       FROM nav_item_logs l
       LEFT JOIN nav_items n ON n.id = l.nav_item_id
       ORDER BY l.created_at DESC
       LIMIT ?`,
      [limit],
    );

    const logs = (rows as Array<{
      id: number;
      link_id: number | null;
      action: string;
      actor_username: string;
      actor_role: string;
      created_at: string;
      detail: unknown;
      link_title: string | null;
    }>).map((row) => ({
      ...row,
      detail: parseJsonDetail(row.detail),
    }));

    if (!logs.length && process.env.NODE_ENV !== "production") {
      return Response.json({ logs: listMockAdminActionLogs(Math.min(limit, 2)) });
    }

    return Response.json({ logs });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/logs] fallback mock:", (error as Error)?.message || error);
      return Response.json({ logs: listMockAdminActionLogs(limit) });
    }
    throw error;
  }
}
