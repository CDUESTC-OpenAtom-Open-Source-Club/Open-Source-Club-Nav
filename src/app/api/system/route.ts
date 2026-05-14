export async function GET() {
  const now = Date.now();
  const uptimeSec = Math.floor(process.uptime());
  const startedAt = new Date(now - uptimeSec * 1000).toISOString();

  return Response.json({
    now: new Date(now).toISOString(),
    uptimeSec,
    startedAt,
  });
}
