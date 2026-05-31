import pool from "@/lib/db";
import { getAdminSessionFromCookies, hashPassword } from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";
import { recordAdminActionLog } from "@/lib/admin-logs";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

const mockUsers = [
  {
    id: 1,
    username: "admin",
    role: "super",
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: "editor",
    role: "editor",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    last_login_at: null,
  },
] as const;

const MOCK_ACTOR = { userId: 1, username: "admin", role: "super" as const };

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

async function requireSuper() {
  await ensureBootstrapSuperUser();
  const session = await getAdminSessionFromCookies();
  if (!session) return { error: Response.json({ error: "未登录" }, { status: 401 }), session: null };
  if (session.role !== "super") return { error: forbidden(), session: null };
  return { error: null, session };
}

export async function GET() {
  if (USE_MOCK) {
    return Response.json({ users: mockUsers });
  }

  try {
    // 用户管理仅允许 super 角色访问。
    const auth = await requireSuper();
    if (auth.error) return auth.error;

    const [rows] = await pool.query(
      "SELECT id, username, role, created_at, last_login_at FROM users WHERE role IN ('super', 'editor') ORDER BY id ASC",
    );
    return Response.json({ users: rows });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/users] 使用 mock 回退：", (error as Error)?.message || error);
      return Response.json({ users: mockUsers });
    }
    return Response.json({ error: "加载用户失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    const user = {
      id: Date.now(),
      username: String(body?.username || "demo-user"),
      role: body?.role === "super" ? "super" : "editor",
      created_at: new Date().toISOString(),
      last_login_at: null,
    };
    await recordAdminActionLog({
      actor: MOCK_ACTOR,
      action: "create_user",
      navItemId: null,
      detail: { created_user: user },
    });
    return Response.json(
      {
        user,
      },
      { status: 201 },
    );
  }

  const requestBody = await request.json().catch(() => ({}));
  try {
    const auth = await requireSuper();
    if (auth.error) return auth.error;

    const body = requestBody;
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const role = body?.role === "super" ? "super" : "editor";

    if (!username || !password) {
      return Response.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    await pool.query(
      `INSERT INTO users
        (email, username, password_hash, role, status, created_by, password, password_changed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, '', NOW(), NOW(3), NOW(3))`,
      ["", username, passwordHash, role, auth.session!.userId],
    );

    const [rows] = await pool.query(
      "SELECT id, username, role, created_at, last_login_at FROM users WHERE username = ? LIMIT 1",
      [username],
    );
    const user = (rows as Array<{
      id: number;
      username: string;
      role: "super" | "editor";
      created_at: string;
      last_login_at: string | null;
    }>)[0];
    await recordAdminActionLog({
      actor: auth.session!,
      action: "create_user",
      navItemId: null,
      detail: {
        created_user: {
          id: user?.id,
          username: user?.username,
          role: user?.role,
          created_at: user?.created_at,
        },
      },
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const body = requestBody;
      const user = {
        id: Date.now(),
        username: String(body?.username || "demo-user"),
        role: body?.role === "super" ? "super" : "editor",
        created_at: new Date().toISOString(),
        last_login_at: null,
      };
      console.warn("[admin/users] 创建用户 mock 回退：", (error as Error)?.message || error);
      return Response.json({ user }, { status: 201 });
    }
    const message = String((error as { message?: string })?.message || "");
    if (message.includes("Duplicate")) {
      return Response.json({ error: "用户名已存在" }, { status: 409 });
    }
    return Response.json({ error: "创建用户失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    await recordAdminActionLog({
      actor: MOCK_ACTOR,
      action: "update_user",
      navItemId: null,
      detail: {
        id: Number(body?.id || 0) || null,
        role: body?.role,
        status: body?.status,
        password_changed: Boolean(body?.password),
      },
    });
    return Response.json({ ok: true, user: body });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const auth = await requireSuper();
    if (auth.error) return auth.error;

    const id = Number(body.id);
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });

    const fields: string[] = [];
    const values: string[] = [];
    if (body.role !== undefined) {
      fields.push("role = ?");
      values.push(body.role === "super" ? "super" : "editor");
    }
    if (body.password !== undefined && String(body.password)) {
      const password = String(body.password);
      if (password.length < 6) return Response.json({ error: "密码至少 6 位" }, { status: 400 });
      fields.push("password_hash = ?", "password = ''", "password_changed_at = NOW()");
      values.push(hashPassword(password));
    }
    if (body.status !== undefined) {
      fields.push("status = ?");
      values.push(body.status ? "1" : "0");
    }
    if (fields.length === 0) return Response.json({ error: "没有可更新字段" }, { status: 400 });

    await pool.query(`UPDATE users SET ${fields.join(", ")}, updated_at = NOW(3) WHERE id = ?`, [...values, id]);
    await recordAdminActionLog({
      actor: auth.session!,
      action: "update_user",
      navItemId: null,
      detail: { id, role: body.role, status: body.status, password_changed: Boolean(body.password) },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/users] 更新用户失败:", error);
    return Response.json({ error: "更新用户失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (USE_MOCK) {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    await recordAdminActionLog({
      actor: MOCK_ACTOR,
      action: "delete_user",
      navItemId: null,
      detail: { id: id || null },
    });
    return Response.json({ ok: true });
  }

  try {
    const auth = await requireSuper();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return Response.json({ error: "缺少 id" }, { status: 400 });
    if (id === auth.session!.userId) return Response.json({ error: "不能删除当前登录用户" }, { status: 400 });

    await pool.query("DELETE FROM users WHERE id = ? AND role IN ('super', 'editor')", [id]);
    await recordAdminActionLog({
      actor: auth.session!,
      action: "delete_user",
      navItemId: null,
      detail: { id },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/users] 删除用户失败:", error);
    return Response.json({ error: "删除用户失败" }, { status: 500 });
  }
}
