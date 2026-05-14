import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  // 日志接口只读，用于后台操作记录列表展示。
  // mock 模式提供几条典型操作记录，方便前端调日志界面。
  if (USE_MOCK) {
    return Response.json({
      logs: [
        { id: 1, link_id: 1, action: "create", actor_username: "admin", actor_role: "super", created_at: new Date().toISOString() },
        { id: 2, link_id: 2, action: "update", actor_username: "editor", actor_role: "editor", created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, link_id: 3, action: "disable", actor_username: "admin", actor_role: "super", created_at: new Date(Date.now() - 7200000).toISOString() },
      ],
    });
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

