import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";
import { MOCK_LOGS } from "@/data/mock/logs";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  if (USE_MOCK) {
    return Response.json({ logs: MOCK_LOGS });
  }

  await ensureAdminTables();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const [rows] = await pool.query(
    `SELECT id, link_id, action, actor_username, actor_role, detail, created_at
     FROM admin_link_logs
     ORDER BY id DESC
     LIMIT 100`,
  );
  return Response.json({ logs: rows });
}
