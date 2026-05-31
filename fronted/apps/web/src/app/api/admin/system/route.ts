import os from "os";
import { readFile } from "fs/promises";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

async function readNetworkBytes() {
  // Linux: /proc/net/dev contains cumulative RX/TX bytes per interface.
  // Fallback to null on unsupported platforms or read failures.
  try {
    const raw = await readFile("/proc/net/dev", "utf8");
    const lines = raw.split("\n").slice(2).map((line) => line.trim()).filter(Boolean);
    let rxTotal = 0;
    let txTotal = 0;
    for (const line of lines) {
      const parts = line.replace(":", " ").trim().split(/\s+/);
      if (parts.length < 17) continue;
      const rx = Number(parts[1] || 0);
      const tx = Number(parts[9] || 0);
      if (Number.isFinite(rx)) rxTotal += rx;
      if (Number.isFinite(tx)) txTotal += tx;
    }
    return {
      rxBytes: Math.max(0, rxTotal),
      txBytes: Math.max(0, txTotal),
      totalBytes: Math.max(0, rxTotal + txTotal),
      sampledAt: new Date().toISOString(),
    };
  } catch {
    return {
      rxBytes: null,
      txBytes: null,
      totalBytes: null,
      sampledAt: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const session = await getAdminSessionFromCookies();
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const load = os.loadavg();
  const network = await readNetworkBytes();

  // 系统面板直接读取当前 Node 进程所在机器的信息，便于快速排查运行状态。
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
    network,
  });
}
