import { clearAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminSessionCookie();
  return Response.json({ ok: true });
}
