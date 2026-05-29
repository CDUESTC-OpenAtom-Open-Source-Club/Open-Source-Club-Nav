import { getAdminSessionFromCookies, isAdminBypassEnabled } from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";

export async function GET() {
  // 非绕过模式下，确保默认超级管理员账号存在。
  if (!isAdminBypassEnabled()) {
    await ensureBootstrapSuperUser();
  }

  const session = await getAdminSessionFromCookies();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    user: {
      id: session.userId,
      username: session.username,
      role: session.role,
    },
  });
}