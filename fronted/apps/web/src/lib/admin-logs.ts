import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";
import type { AdminRole } from "@/lib/admin-auth";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const MOCK_LOG_STORE_KEY = "__kcos_admin_mock_logs_store__";
const MOCK_LOG_SEED: AdminActionLog[] = [
  {
    id: 2,
    link_id: 1,
    action: "create_link",
    actor_username: "admin",
    actor_role: "super",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    detail: {
      input: { title: "示例：资源站", module: "resource_matrix", resource_sub_module: "think_tank" },
      note: "示例日志：新增链接后会显示在这里",
    },
    link_title: "示例：资源站",
  },
  {
    id: 1,
    link_id: null,
    action: "health_check",
    actor_username: "editor",
    actor_role: "editor",
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    detail: {
      checked: 6,
      failed: 1,
      note: "示例日志：健康检测执行记录",
    },
    link_title: null,
  },
];

export type AdminActor = {
  userId: number;
  username: string;
  role: AdminRole;
};

export type AdminActionLog = {
  id: number;
  link_id: number | null;
  action: string;
  actor_username: string;
  actor_role: string;
  created_at: string;
  detail: Record<string, unknown> | null;
  link_title?: string | null;
};

function getMockLogStore(): AdminActionLog[] {
  const root = globalThis as typeof globalThis & { [MOCK_LOG_STORE_KEY]?: AdminActionLog[] };
  if (!root[MOCK_LOG_STORE_KEY]) {
    root[MOCK_LOG_STORE_KEY] = [...MOCK_LOG_SEED];
  }
  return root[MOCK_LOG_STORE_KEY]!;
}

export function listMockAdminActionLogs(limit = 200): AdminActionLog[] {
  return getMockLogStore().slice(0, Math.max(1, Math.min(500, limit)));
}

export async function recordAdminActionLog(params: {
  actor: AdminActor;
  action: string;
  navItemId?: number | null;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  if (USE_MOCK) {
    const store = getMockLogStore();
    const now = new Date().toISOString();
    const nextId = store.length ? Number(store[0].id) + 1 : 1;
    store.unshift({
      id: nextId,
      link_id: params.navItemId ?? null,
      action: String(params.action || "").slice(0, 32),
      actor_username: String(params.actor.username || "").slice(0, 64),
      actor_role: String(params.actor.role || "").slice(0, 32),
      created_at: now,
      detail: (params.detail || {}) as Record<string, unknown>,
      link_title: null,
    });
    return;
  }

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
