import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { ensureAdminTables } from "@/lib/admin-db";

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

    await pool.query(
      `INSERT INTO admin_daily_stats (stat_date, page_views, unique_visitors, link_clicks)
       VALUES (CURDATE(), 1, 0, 0)
       ON DUPLICATE KEY UPDATE page_views = page_views + 1`,
    );

    const [insertResult] = await pool.query(
      `INSERT IGNORE INTO admin_daily_visits (stat_date, visitor_id)
       VALUES (CURDATE(), ?)`,
      [visitorId],
    );
    const affected = Number((insertResult as { affectedRows?: number }).affectedRows || 0);
    if (affected > 0) {
      await pool.query(
        `UPDATE admin_daily_stats
         SET unique_visitors = unique_visitors + 1
         WHERE stat_date = CURDATE()`,
      );
    }

    if (createdCookie) {
      cookieStore.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
