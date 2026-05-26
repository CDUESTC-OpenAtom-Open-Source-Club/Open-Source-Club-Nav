import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { getAdminStats } from "@/services/stats";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  if (!USE_MOCK) {
    await ensureAdminTables();
    const session = await getAdminSessionFromCookies();
    if (!session) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
  }

  const stats = await getAdminStats();
  return Response.json(stats);
}
