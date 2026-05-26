import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

type WifiSnapshot = {
  available: boolean;
  connected: boolean;
  ssid: string | null;
  signalPercent: number | null;
  reason: string | null;
};

let wifiCache: { ts: number; value: WifiSnapshot } | null = null;
const WIFI_CACHE_MS = 5000;

function parsePercent(input: string): number | null {
  const matched = input.match(/(\d{1,3})\s*%/);
  if (!matched) return null;
  const parsed = Number(matched[1]);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

function parseWindowsWifiOutput(stdout: string): WifiSnapshot {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.some((line) => /no wireless interface|找不到无线|没有无线|没有 WLAN/i.test(line))) {
    return {
      available: false,
      connected: false,
      ssid: null,
      signalPercent: null,
      reason: "no-wireless-interface",
    };
  }

  let ssid: string | null = null;
  let stateValue = "";
  let signalPercent: number | null = null;

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    const keyLower = key.toLowerCase();

    if (keyLower === "ssid") {
      if (!value || /^n\/a$/i.test(value)) continue;
      ssid = value;
      continue;
    }

    if (keyLower === "signal" || key.includes("信号")) {
      signalPercent = parsePercent(value);
      continue;
    }

    if (keyLower === "state" || key.includes("状态")) {
      stateValue = value;
    }
  }

  const disconnectedByState = /disconnected|断开|未连接/i.test(stateValue);
  const connected = !disconnectedByState && Boolean(ssid);

  return {
    available: true,
    connected,
    ssid: connected ? ssid : null,
    signalPercent: connected ? signalPercent : null,
    reason: connected ? null : "disconnected",
  };
}

async function getWifiSnapshot(): Promise<WifiSnapshot> {
  const now = Date.now();
  if (wifiCache && now - wifiCache.ts < WIFI_CACHE_MS) {
    return wifiCache.value;
  }

  let snapshot: WifiSnapshot;

  try {
    if (process.platform === "win32") {
      const { stdout } = await execFileAsync("netsh", ["wlan", "show", "interfaces"], {
        windowsHide: true,
      });
      snapshot = parseWindowsWifiOutput(stdout || "");
    } else {
      snapshot = {
        available: false,
        connected: false,
        ssid: null,
        signalPercent: null,
        reason: `unsupported-platform:${process.platform}`,
      };
    }
  } catch {
    snapshot = {
      available: false,
      connected: false,
      ssid: null,
      signalPercent: null,
      reason: "wifi-detect-failed",
    };
  }

  wifiCache = { ts: now, value: snapshot };
  return snapshot;
}

export async function GET() {
  const now = Date.now();
  const uptimeSec = Math.floor(process.uptime());
  const startedAt = new Date(now - uptimeSec * 1000).toISOString();
  const wifi = await getWifiSnapshot();

  return Response.json({
    now: new Date(now).toISOString(),
    serverNow: new Date(now).toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    hostname: os.hostname(),
    uptimeSec,
    startedAt,
    wifi,
  });
}
