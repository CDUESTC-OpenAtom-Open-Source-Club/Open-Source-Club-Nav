import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { ensureAdminTables } from "@/lib/admin-db";
import { recordVisit } from "@/services/stats";

const VISITOR_COOKIE = "kcos_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST() {
  try {
    await ensureAdminTables();

    const cookieStore = await cookies();
    let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    let createdCookie = false;
    if (!visitorId) {
      visitorId = randomUUID();
      createdCookie = true;
    }

    const { newVisitor } = await recordVisit(visitorId);

    if (createdCookie) {
      cookieStore.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }

    return Response.json({ ok: true, newVisitor });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
