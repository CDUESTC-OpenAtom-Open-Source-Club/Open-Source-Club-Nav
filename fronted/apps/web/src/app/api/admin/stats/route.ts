import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { ensureAdminTables } from "@/lib/admin-db";
import { getMockAdminStats } from "@/data/mock/stats";
import { getAdminStats } from "@/services/stats";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  try {
    if (!USE_MOCK) {
      await ensureAdminTables();
      const session = await getAdminSessionFromCookies();
      if (!session) {
        return Response.json({ error: "未登录" }, { status: 401 });
      }
    }

    const stats = await getAdminStats();
    return Response.json(stats);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin/stats] 使用 mock 回退：", (error as Error)?.message || error);
      return Response.json(getMockAdminStats());
    }
    throw error;
  }
}
