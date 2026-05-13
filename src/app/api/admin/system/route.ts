import os from "os";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const load = os.loadavg();
  return Response.json({
    uptimeSec: Math.floor(process.uptime()),
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    cpuCores: os.cpus().length,
    mem: {
      total: memTotal,
      free: memFree,
      used: memTotal - memFree,
      usageRate: memTotal > 0 ? Number((((memTotal - memFree) / memTotal) * 100).toFixed(1)) : 0,
    },
    loadavg: load.map((x) => Number(x.toFixed(2))),
  });
}

