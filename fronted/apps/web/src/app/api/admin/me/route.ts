import { getAdminSessionFromCookies, isAdminBypassEnabled } from "@/lib/admin-auth";
import { ensureBootstrapSuperUser } from "@/lib/admin-db";

export async function GET() {
  if (isAdminBypassEnabled()) {
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

  await ensureBootstrapSuperUser();

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
