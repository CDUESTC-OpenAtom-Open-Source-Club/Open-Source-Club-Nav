import pool from "@/lib/db";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";

export async function GET() {
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

