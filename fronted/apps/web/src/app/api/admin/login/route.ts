import pool from "@/lib/db";
import {
  createSessionToken,
  isAdminBypassEnabled,
  setAdminSessionCookie,
  verifyPassword,
} from "@/lib/admin-auth";
import {
  ensureBootstrapSuperUser,
  getRecentAdminLoginFailures,
  recordAdminLoginAttempt,
} from "@/lib/admin-db";

const MAX_FAILURES_PER_WINDOW = 5;
const FAILURE_WINDOW_MINUTES = 15;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  const remoteAddr = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "";
  let attemptedUsername = "";
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    attemptedUsername = username;

    if (isAdminBypassEnabled()) {
      return Response.json(
        { error: "当前为开发绕过模式，无法执行真实登录，请先设置 ADMIN_BYPASS_LOGIN=false" },
        { status: 409 },
      );
    }

    if (!username || !password) {
      return Response.json({ error: "请输入用户名和密码" }, { status: 400 });
    }
    if (username.length > 64 || password.length > 256) {
      return Response.json({ error: "登录信息格式不合法" }, { status: 400 });
    }

    const recentFailures = await getRecentAdminLoginFailures({
      username,
      remoteAddr,
      withinMinutes: FAILURE_WINDOW_MINUTES,
    });
    if (recentFailures >= MAX_FAILURES_PER_WINDOW) {
      await recordAdminLoginAttempt({
        username,
        remoteAddr,
        userAgent,
        success: false,
        reason: "rate_limited",
      });
      return Response.json(
        { error: `失败次数过多，请在 ${FAILURE_WINDOW_MINUTES} 分钟后重试` },
        { status: 429 },
      );
    }

    await ensureBootstrapSuperUser();
    const [rows] = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username = ? AND status = 1 LIMIT 1",
      [username],
    );

    const user = (rows as Array<{
      id: number;
      username: string;
      password_hash: string;
      role: "super" | "editor";
    }>)[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      await recordAdminLoginAttempt({
        username,
        remoteAddr,
        userAgent,
        success: false,
        reason: "invalid_credentials",
      });
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 登录成功后把最小必要身份信息写入会话，前台后续只依赖 cookie 验证。
    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    await setAdminSessionCookie(token);
    await pool.query(
      "UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?",
      [remoteAddr, user.id],
    );
    await recordAdminLoginAttempt({
      username,
      remoteAddr,
      userAgent,
      success: true,
      reason: "success",
    });

    return Response.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch {
    await recordAdminLoginAttempt({
      username: attemptedUsername,
      remoteAddr,
      userAgent,
      success: false,
      reason: "server_error",
    }).catch(() => {});
    return Response.json({ error: "登录服务异常，请稍后重试" }, { status: 500 });
  }
}
