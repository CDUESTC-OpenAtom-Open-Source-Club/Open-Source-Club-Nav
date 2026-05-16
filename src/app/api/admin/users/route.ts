import pool from "@/lib/db";
import { getAdminSessionFromCookies, hashPassword } from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";

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

function forbidden() {
  return Response.json({ error: "无权限" }, { status: 403 });
}

export async function GET() {
  if (USE_MOCK) {
    return Response.json({ users: mockUsers });
  }

  try {
    // 用户管理仅允许 super 角色访问。
    await ensureBootstrapSuperUser();
    const session = await getAdminSessionFromCookies();
    if (!session) return Response.json({ error: "未登录" }, { status: 401 });
    if (session.role !== "super") return forbidden();

    const [rows] = await pool.query(
      "SELECT id, username, role, created_at, last_login_at FROM admin_users ORDER BY id ASC",
    );
    return Response.json({ users: rows });
  } catch {
    return Response.json({ error: "加载用户失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (USE_MOCK) {
    const body = await request.json().catch(() => ({}));
    return Response.json(
      {
        user: {
          id: Date.now(),
          username: String(body?.username || "demo-user"),
          role: body?.role === "super" ? "super" : "editor",
          created_at: new Date().toISOString(),
          last_login_at: null,
        },
      },
      { status: 201 },
    );
  }

  await ensureBootstrapSuperUser();
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "super") return forbidden();

  try {
    const body = await request.json();
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
      "INSERT INTO admin_users (username, password_hash, role, created_by) VALUES (?, ?, ?, ?)",
      [username, passwordHash, role, session.userId],
    );

    const [rows] = await pool.query(
      "SELECT id, username, role, created_at, last_login_at FROM admin_users WHERE username = ? LIMIT 1",
      [username],
    );
    return Response.json({ user: (rows as Array<unknown>)[0] }, { status: 201 });
  } catch (error) {
    const message = String((error as { message?: string })?.message || "");
    if (message.includes("Duplicate")) {
      return Response.json({ error: "用户名已存在" }, { status: 409 });
    }
    return Response.json({ error: "创建用户失败" }, { status: 500 });
  }
}