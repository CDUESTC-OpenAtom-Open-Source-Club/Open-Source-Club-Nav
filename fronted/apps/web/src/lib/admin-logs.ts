import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";
import type { AdminRole } from "@/lib/admin-auth";

export type AdminActor = {
  userId: number;
  username: string;
  role: AdminRole;
};

export async function recordAdminActionLog(params: {
  actor: AdminActor;
  action: string;
  navItemId?: number | null;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  await ensureAdminTables();
  await pool.query(
    `INSERT INTO nav_item_logs
      (nav_item_id, action, actor_user_id, actor_username, actor_role, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.navItemId ?? null,
      String(params.action || "").slice(0, 32),
      params.actor.userId,
      String(params.actor.username || "").slice(0, 64),
      String(params.actor.role || "").slice(0, 32),
      JSON.stringify(params.detail || {}),
    ],
  );
}

