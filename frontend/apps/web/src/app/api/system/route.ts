// @route-desc BFF API route proxy/handler for /api/system/route.ts
import os from "os";

export const revalidate = 60;

export async function GET() {
  const now = Date.now();
  const uptimeSec = Math.floor(process.uptime());

  return Response.json({
    now: new Date(now).toISOString(),
    serverNow: new Date(now).toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    hostname: os.hostname(),
    uptimeSec,
    startedAt: new Date(now - uptimeSec * 1000).toISOString(),
    status: "ok",
  });
}
