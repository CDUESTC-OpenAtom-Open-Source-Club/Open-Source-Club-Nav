import { ensureAdminTables } from "@/lib/admin-db";
import { recordClick } from "@/services/stats";
import { cookies } from "next/headers";

const VISITOR_COOKIE = "kcos_vid";

export async function POST(request: Request) {
  try {
    await ensureAdminTables();
    const body = await request.json().catch(() => ({})) as {
      navItemId?: number;
      pagePath?: string;
      referrer?: string | null;
      targetUrl?: string;
      targetLabel?: string;
      sourceContext?: string;
    };
    const cookieStore = await cookies();
    const visitorId = cookieStore.get(VISITOR_COOKIE)?.value || null;
    await recordClick({
      navItemId: Number.isFinite(body?.navItemId) ? Number(body.navItemId) : null,
      visitorId,
      pagePath: typeof body?.pagePath === "string" ? body.pagePath.slice(0, 255) : null,
      referrer:
        typeof body?.referrer === "string" && body.referrer
          ? body.referrer.slice(0, 500)
          : request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      targetUrl: typeof body?.targetUrl === "string" ? body.targetUrl.slice(0, 500) : null,
      targetLabel: typeof body?.targetLabel === "string" ? body.targetLabel.slice(0, 255) : null,
      sourceContext: typeof body?.sourceContext === "string" ? body.sourceContext.slice(0, 128) : null,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
