import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";

export async function GET() {
  // 首次启动且未关闭引导时，先确保默认超级管理员账号存在。
  if (process.env.ADMIN_BYPASS_LOGIN === "false") {
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