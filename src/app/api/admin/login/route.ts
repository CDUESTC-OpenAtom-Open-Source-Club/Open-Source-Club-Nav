import pool from "@/lib/db";
import {
  createSessionToken,
  setAdminSessionCookie,
  verifyPassword,
} from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) {
      return Response.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    await ensureBootstrapSuperUser();
    const [rows] = await pool.query(
      "SELECT id, username, password_hash, role FROM admin_users WHERE username = ? LIMIT 1",
      [username],
    );

    const user = (rows as Array<{
      id: number;
      username: string;
      password_hash: string;
      role: "super" | "editor";
    }>)[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 登录成功后把最小必要身份信息写入会话，前台后续只依赖 cookie 验证。
    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    await setAdminSessionCookie(token);
    await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    return Response.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch {
    return Response.json({ error: "登录失败" }, { status: 500 });
  }
}