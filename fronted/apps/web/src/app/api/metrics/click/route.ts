import { ensureAdminTables } from "@/lib/admin-db";
import { recordClick } from "@/services/stats";

export async function POST() {
  try {
    await ensureAdminTables();
    await recordClick();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
