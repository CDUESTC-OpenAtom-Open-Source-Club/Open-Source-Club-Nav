"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_HEALTH } from "@/data/mock/health";

type AdminUser = {
  id: number;
  username: string;
  role: "super" | "editor";
  created_at: string;
  last_login_at: string | null;
};

type LinkItem = {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
  active: number;
};

type StatDay = {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
};
type SystemInfo = {
  uptimeSec: number;
  cpuCores: number;
  node: string;
  platform: string;
  loadavg: number[];
  mem: { total: number; free: number; used: number; usageRate: number };
};
type LinkHealth = {
  link_id: number;
  url: string;
  title: string;
  status_code: number | null;
  is_ok: number;
  message: string;
  checked_at: string;
};
type LinkLog = {
  id: number;
  link_id: number | null;
  action: string;
  actor_username: string;
  actor_role: string;
  created_at: string;
  detail?: unknown;
};

const baseSections = [
  { id: "overview", label: "棣栭〉" },
  { id: "links", label: "閾炬帴绠＄悊" },
  { id: "popular", label: "鐑棬浠撳簱" },
  { id: "health", label: "鍋ュ悍妫€娴? },
  { id: "logs", label: "鎿嶄綔鏃ュ織" },
] as const;

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function formatLogDetail(detail: unknown): string {
  if (detail === null || detail === undefined) return "-";
  if (typeof detail === "string") {
    const text = detail.trim();
    if (!text) return "-";
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed);
    } catch {
      return text;
    }
  }
  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

function formatLogTime(input: string): string {
  if (!input) return "-";
  return String(input).replace("T", " ").slice(0, 19);
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}澶?{hours}灏忔椂`;
  if (hours > 0) return `${hours}灏忔椂${minutes}鍒嗛挓`;
  return `${minutes}鍒嗛挓`;
}

function formatBytes(input: number): string {
  if (!Number.isFinite(input) || input <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = input;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

type HealthFilter = "all" | "ok" | "bad";
type HealthRange = "all" | "24h" | "7d";
type HealthSort = "desc" | "asc";

function formatClock(input: string): string {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRelativeClock(input: string): string {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60 * 1000) return "鍒氬垰";
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))}鍒嗛挓鍓峘;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `浠婂ぉ ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `鏄ㄥぉ ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)))}澶╁墠`;
  return formatClock(input);
}

function snapshotMockHealth(): LinkHealth[] {
  const now = Date.now();
  return MOCK_HEALTH.map((item, index) => ({
    ...item,
    checked_at: new Date(now - index * 25 * 60 * 1000).toISOString(),
  }));
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string; role: "super" | "editor" } | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<StatDay[]>([]);
  const [error, setError] = useState("");
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [health, setHealth] = useState<LinkHealth[]>([]);
  const [logs, setLogs] = useState<LinkLog[]>([]);
  const [trend7, setTrend7] = useState<Array<{ stat_date: string; link_clicks: number }>>([]);
  const [popular, setPopular] = useState<Array<{ repo: string; clicks: number }>>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [loadedSections, setLoadedSections] = useState<Record<string, boolean>>({});
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [trendHovered, setTrendHovered] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [healthRange, setHealthRange] = useState<HealthRange>("all");
  const [healthSort, setHealthSort] = useState<HealthSort>("desc");
  const [healthQuery, setHealthQuery] = useState("");
  const [healthFrequency, setHealthFrequency] = useState("5m");
  const [healthHelpOpen, setHealthHelpOpen] = useState(false);
  const [healthDetail, setHealthDetail] = useState<LinkHealth | null>(null);

  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    description: "",
    sort: 0,
  });
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "editor" as "editor" | "super",
  });

  // 椤堕儴 KPI 榛樿鍙栨渶鏂颁竴澶╋紝娌℃湁鏁版嵁鏃跺洖閫€鍒扮┖缁熻銆?
  const today = useMemo(
    () =>
      stats[0] || {
        stat_date: new Date().toISOString().slice(0, 10),
        page_views: 0,
        unique_visitors: 0,
        link_clicks: 0,
      },
    [stats],
  );

  const sections = useMemo(
    () => (user && user.role === "super"
      ? [...baseSections, { id: "users", label: "鐢ㄦ埛绠＄悊" as const }]
      : baseSections),
    [user],
  );

  const lineChart = useMemo(() => {
    const source = trend7.length
      ? trend7
      : Array.from({ length: 7 }).map((_, i) => ({
          stat_date: `D${i + 1}`,
          link_clicks: 0,
        }));

    const width = 760;
    const height = 220;
    const padding = { top: 18, right: 18, bottom: 32, left: 26 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(3, ...source.map((item) => item.link_clicks || 0));

    const points = source.map((item, index) => {
      const x =
        padding.left +
        (source.length === 1 ? innerWidth / 2 : (innerWidth / Math.max(1, source.length - 1)) * index);
      const y =
        padding.top +
        innerHeight -
        ((item.link_clicks || 0) / maxValue) * innerHeight;
      return {
        ...item,
        x,
        y,
      };
    });

    const buildSmoothPath = (list: typeof points) => {
      if (!list.length) return "";
      if (list.length === 1) return `M ${list[0].x} ${list[0].y}`;
      let path = `M ${list[0].x} ${list[0].y}`;
      for (let i = 0; i < list.length - 1; i += 1) {
        const current = list[i];
        const next = list[i + 1];
        const midX = (current.x + next.x) / 2;
        path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
      }
      return path;
    };

    const linePath = buildSmoothPath(points);

    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
      : "";

    const yTicks = Array.from({ length: 4 }).map((_, index) => {
      const value = Math.round((maxValue / 3) * (3 - index));
      const y = padding.top + (innerHeight / 3) * index;
      return { value, y };
    });

    return { width, height, padding, innerWidth, innerHeight, points, linePath, areaPath, yTicks };
  }, [trend7]);

  const healthMetrics = useMemo(() => {
    const total = health.length;
    const healthy = health.filter((item) => item.is_ok).length;
    const abnormal = Math.max(0, total - healthy);
    const score = total ? Math.round((healthy / total) * 100) : 0;
    return { total, healthy, abnormal, score };
  }, [health]);

  const healthView = useMemo(() => {
    const now = Date.now();
    const query = healthQuery.trim().toLowerCase();
    return health
      .filter((item) => {
        if (healthFilter === "ok" && !item.is_ok) return false;
        if (healthFilter === "bad" && item.is_ok) return false;
        if (query) {
          const haystack = `${item.title || ""} ${item.url || ""}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (healthRange !== "all") {
          const checked = new Date(item.checked_at).getTime();
          const windowMs = healthRange === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
          if (Number.isNaN(checked) || now - checked > windowMs) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const left = new Date(a.checked_at).getTime();
        const right = new Date(b.checked_at).getTime();
        return healthSort === "desc" ? right - left : left - right;
      });
  }, [health, healthFilter, healthQuery, healthRange, healthSort]);

  const markSectionLoaded = useCallback((sectionId: string) => {
    setLoadedSections((prev) => (prev[sectionId] ? prev : { ...prev, [sectionId]: true }));
  }, []);

  const loadStats = useCallback(async () => {
    const statsRes = await fetch("/api/admin/stats");
    if (!statsRes.ok) throw new Error("鍔犺浇缁熻澶辫触");
    const statsData = await readJsonSafe<{
      days?: StatDay[];
      trend7?: Array<{ stat_date: string; link_clicks: number }>;
      popularRepos?: Array<{ repo: string; clicks: number }>;
      popularCategories?: Array<{ category: string; clicks: number }>;
    }>(statsRes);
    setStats(statsData?.days || []);
    setTrend7(statsData?.trend7 || []);
    const repos =
      statsData?.popularRepos ||
      (statsData?.popularCategories || []).map((item) => ({
        repo: item.category,
        clicks: item.clicks,
      }));
    setPopular(repos);
    markSectionLoaded("popular");
  }, [markSectionLoaded]);

  const loadSystem = useCallback(async () => {
    const sysRes = await fetch("/api/admin/system");
    if (!sysRes.ok) throw new Error("鍔犺浇绯荤粺淇℃伅澶辫触");
    const systemData = await readJsonSafe<SystemInfo>(sysRes);
    setSystem(systemData);
  }, []);

  const loadOverview = useCallback(async () => {
    await Promise.all([loadStats(), loadSystem()]);
    markSectionLoaded("overview");
  }, [loadStats, loadSystem, markSectionLoaded]);

  const loadLinks = useCallback(async () => {
    const linksRes = await fetch("/api/admin/links");
    if (!linksRes.ok) throw new Error("鍔犺浇閾炬帴澶辫触");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
    markSectionLoaded("links");
  }, [markSectionLoaded]);

  const loadUsers = useCallback(async () => {
    const usersRes = await fetch("/api/admin/users");
    if (!usersRes.ok) throw new Error("鍔犺浇鐢ㄦ埛澶辫触");
    const usersData = await readJsonSafe<{ users?: AdminUser[] }>(usersRes);
    setUsers(usersData?.users || []);
    markSectionLoaded("users");
  }, [markSectionLoaded]);

  const loadHealth = useCallback(async () => {
    setHealth(snapshotMockHealth());
    markSectionLoaded("health");
  }, [markSectionLoaded]);

  const loadLogs = useCallback(async () => {
    const logRes = await fetch("/api/admin/logs");
    if (!logRes.ok) throw new Error("鍔犺浇鏃ュ織澶辫触");
    const logsData = await readJsonSafe<{ logs?: LinkLog[] }>(logRes);
    setLogs(logsData?.logs || []);
    markSectionLoaded("logs");
  }, [markSectionLoaded]);

  const loadSectionById = useCallback(async (sectionId: string, role: "super" | "editor") => {
    if (sectionId === "overview") {
      await loadOverview();
      return;
    }
    if (sectionId === "links") {
      await loadLinks();
      return;
    }
    if (sectionId === "popular") {
      await loadStats();
      return;
    }
    if (sectionId === "health") {
      await loadHealth();
      return;
    }
    if (sectionId === "logs") {
      await loadLogs();
      return;
    }
    if (sectionId === "users" && role === "super") {
      await loadUsers();
    }
  }, [loadHealth, loadLinks, loadLogs, loadOverview, loadStats, loadUsers]);

  useEffect(() => {
    // 鍏堢‘璁ゅ綋鍓嶇櫥褰曟€侊紝鍐嶅喅瀹氭槸鍚﹁繘鍏ュ悗鍙版垨璺宠浆鐧诲綍椤点€?
    const init = async () => {
      try {
        const meRes = await fetch("/api/admin/me");
        if (!meRes.ok) {
          router.replace("/admin/login");
          return;
        }
        const me = await readJsonSafe<{ user?: { id: number; username: string; role: "super" | "editor" } }>(meRes);
        if (!me?.user) {
          throw new Error("鐧诲綍鎬佸紓甯?);
        }
        setUser(me.user);
        await Promise.all([loadOverview(), loadLinks()]);
        setLoadedSections({ overview: true, popular: true, links: true });
      } catch {
        setError("鍔犺浇鍚庡彴鏁版嵁澶辫触");
      } finally {
        setChecking(false);
      }
    };
    init();
  }, [loadLinks, loadOverview, router]);

  // 褰撳墠鍚庡彴鏄€滃崟椤垫ā鍧楀垏鎹⑩€濇ā寮忥紝杩欓噷鍙垏鎹㈠彲瑙佹ā鍧楋紝涓嶈蛋璺敱璺宠浆銆?
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (!user || loadedSections[sectionId]) return;
    loadSectionById(sectionId, user.role).catch(() => {
      setError("鍔犺浇妯″潡鏁版嵁澶辫触");
    });
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  };

  const submitLink = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkForm),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "鏂板閾炬帴澶辫触");
      setLinkForm({ title: "", url: "", description: "", sort: 0 });
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
        loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "鏂板閾炬帴澶辫触"));
    }
  };

  // 鍒犻櫎鍚庝細閲嶆柊鎷夊彇鍒楄〃锛屼繚璇佽〃鏍煎拰缁熻鍖哄悓姝ュ埛鏂般€?
  const removeLink = async (id: number) => {
    await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
    await Promise.all([
      loadLinks(),
      loadLogs().catch(() => {}),
      loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
    ]);
  };

  // 鍚敤/绂佺敤鍏辩敤鍚屼竴涓洿鏂板叆鍙ｏ紝鍙垏 active 瀛楁銆?
  const toggleActive = async (item: LinkItem) => {
    await fetch("/api/admin/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: item.active ? 0 : 1 }),
    });
    await Promise.all([
      loadLinks(),
      loadLogs().catch(() => {}),
      loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
      loadedSections.health ? loadHealth().catch(() => {}) : Promise.resolve(),
    ]);
  };

  const submitUser = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "鍒涘缓鐢ㄦ埛澶辫触");
      setUserForm({ username: "", password: "", role: "editor" });
      await loadUsers();
    } catch (err) {
      setError(String((err as Error).message || "鍒涘缓鐢ㄦ埛澶辫触"));
    }
  };
  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      setHealth(snapshotMockHealth());
    } catch (err) {
      setError(String((err as Error).message || "妫€娴嬪け璐?));
    } finally {
      setHealthChecking(false);
    }
  };

  if (checking) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="admin-shell" style={{ display: "grid", gap: 12, position: "relative", zIndex: 1 }}>
      <div className="admin-console-layout">
        <aside className="admin-console-sidebar">
          <div className="admin-console-side-title">鎺у埗鍙?/div>
          {/* 宸︿晶鑿滃崟鍙礋璐ｅ垏鎹㈡ā鍧楋紝涓嶆壙杞借矾鐢辩姸鎬併€?*/}
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`admin-console-side-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </aside>

        <div className="admin-console-content">
      {/* 杩欎竴鍧椾繚鐣欎负鍚庡彴缁熶竴澶撮儴锛屾墍鏈夋ā鍧楀垏鎹㈡椂閮芥樉绀恒€?*/}
      <div id="overview" className="admin-card admin-console-anchor-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "rgba(226,238,252,0.94)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.18)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            绠＄悊鍚庡彴
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            褰撳墠鐢ㄦ埛锛歿user.username}锛坽user.role}锛?
          </div>
        </div>
        <button type="button" onClick={logout} className="admin-btn-ghost">
          閫€鍑虹櫥褰?
        </button>
      </div>

      {error ? (
        <div style={{ color: "#DC2626", fontSize: 12 }}>{error}</div>
      ) : null}
      {/* 姣忔鍙覆鏌撲竴涓ā鍧楋紝鍑忓皯淇℃伅鍫嗗彔锛屼繚鎸佸悗鍙板崟椤靛垏鎹綋楠屻€?*/}
      {activeSection === "overview" ? (
        <>
          <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
            <div className="admin-console-pagehead-title">棣栭〉鎬昏</div>
            <div className="admin-console-pagehead-desc">鏌ョ湅绯荤粺杩愯鐘舵€併€佷粖鏃ヨ闂暟鎹拰鍚庡彴鍏ㄥ眬鎽樿銆?/div>
          </div>
          <div className="admin-card admin-console-section-card admin-system-panel" style={{ padding: 16 }}>
            <div className="admin-system-panel__head">
              <div>
                <div className="admin-system-panel__title">鏈嶅姟鍣ㄨ繍琛屾儏鍐?/div>
                <div className="admin-system-panel__desc">瀹炴椂鐩戞帶褰撳墠涓绘満銆丯ode 杩涚▼涓庡唴瀛樿礋杞姐€?/div>
              </div>
              <div className="admin-system-panel__badge">LIVE</div>
            </div>
            <div className="admin-system-panel__grid">
              <div className="admin-system-gauge">
                <svg viewBox="0 0 120 120" className="admin-system-gauge__svg" aria-label="鍐呭瓨鍗犵敤浠〃鐩?>
                  <circle cx="60" cy="60" r="46" className="admin-system-gauge__track" />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    className="admin-system-gauge__value"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - (system?.mem?.usageRate ?? 0) / 100)}`}
                  />
                </svg>
                <div className="admin-system-gauge__center">
                  <div className="admin-system-gauge__valueText">{system?.mem?.usageRate ?? 0}%</div>
                  <div className="admin-system-gauge__label">鍐呭瓨鍗犵敤</div>
                </div>
              </div>
              <div className="admin-system-bars">
                {[
                  { label: "CPU 鏍稿績", value: `${system?.cpuCores ?? 0} cores`, ratio: Math.min(100, (system?.cpuCores ?? 0) * 12) },
                  { label: "Load 1m", value: `${system?.loadavg?.[0] ?? 0}`, ratio: Math.min(100, ((system?.loadavg?.[0] ?? 0) / Math.max(1, system?.cpuCores ?? 1)) * 100) },
                  { label: "鍐呭瓨宸茬敤", value: formatBytes(system?.mem?.used ?? 0), ratio: system?.mem?.usageRate ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="admin-system-bars__item">
                    <div className="admin-system-bars__meta">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="admin-system-bars__track">
                      <div className="admin-system-bars__fill" style={{ width: `${Math.min(100, Math.max(8, item.ratio))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-system-panel__foot">
              <span>杩愯鏃堕暱锛歿formatDuration(system?.uptimeSec ?? 0)}</span>
              <span>Node锛歿system?.node || "-"}</span>
              <span>骞冲彴锛歿system?.platform || "-"}</span>
              <span>鍐呭瓨鎬婚噺锛歿formatBytes(system?.mem?.total ?? 0)}</span>
            </div>
          </div>

          <div
            className="admin-console-kpi-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {[
              { label: "浠婃棩瀹㈡祦閲?(PV)", value: today.page_views },
              { label: "浠婃棩瀹㈡祦閲?(UV)", value: today.unique_visitors },
              { label: "浠婃棩鐐瑰嚮閲?, value: today.link_clicks },
            ].map((item) => (
              <div key={item.label} className="admin-card admin-console-kpi-card" style={{ padding: 12, background: "rgba(214,231,250,0.95)", borderColor: "#93C5FD", boxShadow: "0 10px 26px rgba(37,99,235,0.16)" }}>
                <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 26, color: "#1D4ED8", fontWeight: 800 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
      {activeSection === "popular" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">鐑棬浠撳簱</div>
        <div className="admin-console-pagehead-desc">鑱氬悎鏌ョ湅杩?7 澶╃偣鍑昏蛋鍔夸笌浠撳簱鐑害琛ㄧ幇銆?/div>
      </div>
      <div id="popular" className="admin-card admin-console-chart-card admin-console-anchor-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>杩?澶╃偣鍑昏蛋鍔?/div>
        <div
          className="admin-console-chart-surface"
          style={{
            minHeight: 220,
            border: "1px dashed #93C5FD",
            borderRadius: 10,
            padding: 10,
            background: "linear-gradient(180deg, rgba(255,255,255,0.74), rgba(239,246,255,0.82))",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={() => setTrendHovered(true)}
          onMouseLeave={() => {
            setTrendHovered(false);
            setHoveredTrendIndex(null);
          }}
        >
          {hoveredTrendIndex !== null && lineChart.points[hoveredTrendIndex] ? (
            <div
              style={{
                position: "absolute",
                left: `${(lineChart.points[hoveredTrendIndex].x / lineChart.width) * 100}%`,
                top: 18,
                transform: "translateX(-50%)",
                padding: "6px 9px",
                borderRadius: 10,
                border: "1px solid rgba(147,197,253,0.9)",
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 12px 28px rgba(37,99,235,0.14)",
                pointerEvents: "none",
                zIndex: 2,
                display: "grid",
                gap: 2,
              }}
            >
              <div style={{ fontSize: 10, color: "#64748B" }}>
                {String(lineChart.points[hoveredTrendIndex].stat_date).slice(5)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
                鐐瑰嚮閲?{lineChart.points[hoveredTrendIndex].link_clicks}
              </div>
            </div>
          ) : null}
          <svg
            viewBox={`0 0 ${lineChart.width} ${lineChart.height}`}
            style={{ width: "100%", height: 220, display: "block", overflow: "visible" }}
            aria-label="杩?澶╃偣鍑昏蛋鍔挎姌绾垮浘"
            onMouseLeave={() => setHoveredTrendIndex(null)}
          >
            <defs>
              <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="45%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
            </defs>

            {lineChart.yTicks.map((tick) => (
              <g key={`y-${tick.y}`}>
                <line
                  x1={lineChart.padding.left}
                  x2={lineChart.width - lineChart.padding.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="#DBEAFE"
                  strokeDasharray="4 4"
                />
                <text
                  x={lineChart.padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748B"
                >
                  {tick.value}
                </text>
              </g>
            ))}

            {lineChart.points.map((point) => (
              <line
                key={`x-grid-${point.stat_date}`}
                x1={point.x}
                x2={point.x}
                y1={lineChart.padding.top}
                y2={lineChart.padding.top + lineChart.innerHeight}
                stroke="#E5EEF9"
              />
            ))}

            {hoveredTrendIndex !== null && lineChart.points[hoveredTrendIndex] ? (
              <line
                x1={lineChart.points[hoveredTrendIndex].x}
                x2={lineChart.points[hoveredTrendIndex].x}
                y1={lineChart.padding.top}
                y2={lineChart.padding.top + lineChart.innerHeight}
                stroke="#60A5FA"
                strokeDasharray="5 4"
                opacity="0.9"
              />
            ) : null}

            {lineChart.areaPath ? (
              <path d={lineChart.areaPath} fill="url(#trendAreaFill)" />
            ) : null}
            {lineChart.linePath ? (
              <path
                d={lineChart.linePath}
                fill="none"
                stroke={trendHovered ? "url(#trendLineGradient)" : "#2F80FF"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: trendHovered
                    ? "drop-shadow(0 12px 22px rgba(244,114,182,0.24))"
                    : "drop-shadow(0 10px 18px rgba(47,128,255,0.20))",
                  transition: "filter 0.18s ease",
                }}
              />
            ) : null}

            {lineChart.points.map((point, index) => (
              <g key={point.stat_date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredTrendIndex === index ? "8" : "5.5"}
                  fill="#FFFFFF"
                  stroke="#2F80FF"
                  strokeWidth={hoveredTrendIndex === index ? "4" : "3"}
                  style={{ transition: "all 0.18s ease" }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="18"
                  fill="transparent"
                  onMouseEnter={() => setHoveredTrendIndex(index)}
                />
                <text
                  x={point.x}
                  y={lineChart.height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748B"
                >
                  {String(point.stat_date).slice(5)}
                </text>
              </g>
            ))}
          </svg>
          {!trend7.length ? (
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>鏆傛棤 7 澶╃偣鍑绘暟鎹紝鍥捐〃鍖哄煙宸查鐣欍€?/div>
          ) : null}
        </div>
        <div style={{ fontWeight: 700, margin: "12px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span>鐑棬浠撳簱锛堢偣鍑婚噺锛?/span>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            鎬荤偣鍑?{popular.reduce((sum, item) => sum + Number(item.clicks || 0), 0)}
          </span>
        </div>
        <div className="admin-console-chart-surface admin-popular-list" style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)", display: "grid", gap: 8 }}>
          {(popular.length
            ? popular
            : Array.from({ length: 5 }).map((_, i) => ({ repo: `浠撳簱${i + 1}`, clicks: 0 })))
            .map((p, index, arr) => {
              const maxClicks = Math.max(1, ...arr.map((item) => Number(item.clicks || 0)));
              const ratio = Math.max(8, Math.round((Number(p.clicks || 0) / maxClicks) * 100));
              const palette = [
                ["#7c3aed", "#c084fc"],
                ["#2563eb", "#60a5fa"],
                ["#0f766e", "#2dd4bf"],
                ["#c2410c", "#fb923c"],
                ["#be185d", "#f472b6"],
              ][index % 5];
              return (
            <div key={p.repo} className="admin-popular-row">
              <div className="admin-popular-row__rank">{String(index + 1).padStart(2, "0")}</div>
              <div className="admin-popular-row__body">
                <div className="admin-popular-row__top">
                  <span className="admin-popular-row__repo" title={p.repo}>{p.repo}</span>
                  <span className="admin-popular-row__value">{p.clicks}</span>
                </div>
                <div className="admin-popular-row__track">
                  <div
                    className="admin-popular-row__fill"
                    style={{
                      width: `${ratio}%`,
                      background: `linear-gradient(90deg, ${palette[0]}, ${palette[1]})`,
                    }}
                  />
                </div>
              </div>
            </div>
              );
            })}
          {!popular.length ? <div style={{ fontSize: 12, color: "#64748B" }}>鏆傛棤鐑棬浠撳簱鏁版嵁锛屽浘琛ㄥ尯鍩熷凡棰勭暀銆?/div> : null}
        </div>
      </div>
      </>
      ) : null}

      {activeSection === "links" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">閾炬帴绠＄悊</div>
        <div className="admin-console-pagehead-desc">缁存姢瀵艰埅閾炬帴鍐呭锛屽揩閫熻繘琛屾柊澧炪€佸惎鐢ㄣ€佺鐢ㄥ拰鍒犻櫎鎿嶄綔銆?/div>
      </div>
      <div id="links" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
          閾炬帴绠＄悊锛坋ditor/super锛?
        </div>
        <form onSubmit={submitLink} style={{ display: "grid", gap: 8 }}>
          <input
            className="admin-input"
            placeholder="鏍囬"
            value={linkForm.title}
            onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="URL"
            value={linkForm.url}
            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="鎻忚堪"
            value={linkForm.description}
            onChange={(e) =>
              setLinkForm({ ...linkForm, description: e.target.value })
            }
          />
          <input
            className="admin-input"
            type="number"
            placeholder="鎺掑簭"
            value={linkForm.sort}
            onChange={(e) => setLinkForm({ ...linkForm, sort: Number(e.target.value || 0) })}
            style={{ maxWidth: 140 }}
          />
          <button type="submit" className="admin-btn" style={{ width: 120 }}>
            娣诲姞閾炬帴
          </button>
        </form>

        <div className="admin-console-table-shell" style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["ID", "鏍囬", "URL", "鐘舵€?, "鎿嶄綔"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #93C5FD", padding: "8px 6px", color: "#1E3A8A", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((item) => (
                <tr key={item.id}>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.id}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.title}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.url}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.active ? "鍚敤" : "绂佺敤"}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px", display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => toggleActive(item)} style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      {item.active ? "绂佺敤" : "鍚敤"}
                    </button>
                    <button type="button" onClick={() => removeLink(item.id)} style={{ border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      鍒犻櫎
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : null}
      {activeSection === "health" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">鍋ュ悍妫€娴?/div>
        <div className="admin-console-pagehead-desc">浣跨敤鍓嶇妯℃嫙鏁版嵁灞曠ず鐩戞帶姒傝銆佺瓫閫夈€佹帓搴忎笌寮傚父楂樹寒銆?/div>
      </div>
      <div id="health" className="admin-card admin-console-section-card admin-console-anchor-card admin-health-panel">
        <div className="admin-health-overview">
          <div className="admin-health-score">
            <div className="admin-health-score__label">鍋ュ悍搴﹁瘎鍒?/div>
            <div className="admin-health-score__value">{healthMetrics.score}%</div>
            <div className={`admin-health-score__meta ${healthMetrics.abnormal ? "danger" : ""}`}>{healthMetrics.abnormal ? `${healthMetrics.abnormal} 涓紓甯竊 : "鍏ㄩ儴杩愯姝ｅ父"}</div>
          </div>
          <div className="admin-health-kpis">
            <div className="admin-health-kpi"><span>鎬荤洃鎺ч」</span><strong>{healthMetrics.total}</strong></div>
            <div className="admin-health-kpi"><span>姝ｅ父</span><strong>{healthMetrics.healthy}</strong></div>
            <div className="admin-health-kpi admin-health-kpi--danger"><span>寮傚父</span><strong>{healthMetrics.abnormal}</strong></div>
          </div>
        </div>

        <div className="admin-health-toolbar">
          <div className="admin-health-toolbar__left">
            <button type="button" onClick={runHealthCheck} className="admin-btn admin-health-primary" disabled={healthChecking}>
              {healthChecking ? "鎺㈡祴涓?.." : "鎵归噺鎺㈡祴"}
            </button>
            <label className="admin-health-field">
              <span>鎺㈡祴棰戠巼</span>
              <select className="admin-input" value={healthFrequency} onChange={(e) => setHealthFrequency(e.target.value)}>
                <option value="5m">姣?5 鍒嗛挓</option>
                <option value="15m">姣?15 鍒嗛挓</option>
                <option value="30m">姣?30 鍒嗛挓</option>
                <option value="manual">鎵嬪姩</option>
              </select>
            </label>
          </div>
          <div className="admin-health-toolbar__right admin-health-help-wrap">
            <div className="admin-health-segment">
              {(["all", "ok", "bad"] as const).map((item) => (
                <button key={item} type="button" className={`admin-health-segment__item ${healthFilter === item ? "active" : ""}`} onClick={() => setHealthFilter(item)}>
                  {item === "all" ? "鍏ㄩ儴" : item === "ok" ? "姝ｅ父" : "寮傚父"}
                </button>
              ))}
            </div>
            <label className="admin-health-field admin-health-field--wide">
              <span>鎼滅储</span>
              <input className="admin-input" placeholder="鎸?URL 鎴栧悕绉版悳绱? value={healthQuery} onChange={(e) => setHealthQuery(e.target.value)} />
            </label>
            <label className="admin-health-field">
              <span>鏃堕棿鑼冨洿</span>
              <select className="admin-input" value={healthRange} onChange={(e) => setHealthRange(e.target.value as HealthRange)}>
                <option value="all">鍏ㄩ儴</option>
                <option value="24h">杩?24 灏忔椂</option>
                <option value="7d">杩?7 澶?/option>
              </select>
            </label>
            <button type="button" className="admin-health-help" onClick={() => setHealthHelpOpen((prev) => !prev)} aria-label="鏌ョ湅璇存槑">?</button>
            {healthHelpOpen ? (
              <div className="admin-health-help-popover">
                <div className="admin-health-help-popover__title">鎺㈡祴瑙勫垯</div>
                <div>鈥?鍙睍绀烘渶杩戜竴娆℃帰娴嬬粨鏋溿€?/div>
                <div>鈥?200-299 瑙嗕负杩愯姝ｅ父锛屽叾浣欒涓哄紓甯搞€?/div>
                <div>鈥?瓒呮椂銆佸煙鍚嶄笉鍙揪銆佽瘉涔﹀紓甯搁兘浼氭爣璁颁负寮傚父銆?/div>
                <div>鈥?寮傚父琛岄珮浜紝渚夸簬蹇€熸帓鏌ャ€?/div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-health-table-shell">
          <div className="admin-health-table-shell__head">
            <div className="admin-health-table-shell__titlewrap">
              <div className="admin-health-table-shell__title">鍋ュ悍妫€娴?/div>
              <div className="admin-health-table-shell__meta">
                褰撳墠瑙嗗浘 {healthView.length} 椤?路 寮傚父 {healthView.filter((item) => !item.is_ok).length} 椤?              </div>
            </div>
            <button type="button" className="admin-health-sort" onClick={() => setHealthSort((prev) => (prev === "desc" ? "asc" : "desc"))}>
              鏈€杩戞帰娴嬫椂闂?{healthSort === "desc" ? "鈫? : "鈫?}
            </button>
          </div>
          <div className="admin-console-table-shell admin-health-table-wrap">
            <table className="admin-health-table">
              <thead>
                <tr>
                  <th>鐩戞帶瀵硅薄 / 鐩爣鍦板潃</th>
                  <th>鎺㈡祴鐘舵€?/th>
                  <th>鏈€杩戞帰娴嬫椂闂?/th>
                  <th>鎿嶄綔</th>
                </tr>
              </thead>
              <tbody>
                {healthChecking ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="admin-health-row--skeleton">
                      <td colSpan={4}><div className="admin-health-skeleton-row"><span /><span /><span /></div></td>
                    </tr>
                  ))
                ) : healthView.length ? (
                  healthView.map((h) => (
                    <tr key={h.link_id} className={h.is_ok ? "" : "admin-health-row--error"}>
                      <td>
                        <div className="admin-health-target">
                          <div className="admin-health-target__name">{h.title || `#${h.link_id}`}</div>
                          <div className="admin-health-target__url">{h.url}</div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-health-status">
                          <span className={`admin-health-status__dot ${h.is_ok ? "ok" : "bad"}`} />
                          <span className="admin-health-status__text">{h.is_ok ? "杩愯姝ｅ父" : "鏈嶅姟涓嶅彲鐢?}</span>
                          {h.status_code ? <span className="admin-health-status__code">HTTP {h.status_code}</span> : null}
                        </div>
                        <div className="admin-health-status__meta">{h.message || (h.is_ok ? "鍝嶅簲绋冲畾" : "闇€瑕佺珛鍗虫帓鏌?)}</div>
                      </td>
                      <td title={formatClock(h.checked_at)}>{formatRelativeClock(h.checked_at)}</td>
                      <td>
                        <div className="admin-health-actions">
                          <button type="button" className="admin-health-link" onClick={() => setHealthDetail(h)}>璇︽儏</button>
                          <button type="button" className="admin-health-link" onClick={runHealthCheck}>閲嶈瘯</button>
                          <button type="button" className="admin-health-copy" onClick={() => navigator.clipboard?.writeText(h.url).catch(() => {})}>澶嶅埗</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="admin-health-empty">鏆傛棤鍖归厤缁撴灉</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {healthDetail ? (
            <div className="admin-health-detail">
              <div className="admin-health-detail__title">{healthDetail.title || `#${healthDetail.link_id}`}</div>
              <div>鍦板潃锛歿healthDetail.url}</div>
              <div>鐘舵€侊細{healthDetail.is_ok ? "杩愯姝ｅ父" : `鏈嶅姟涓嶅彲鐢?{healthDetail.status_code ? `锛圚TTP ${healthDetail.status_code}锛塦 : ""}`}</div>
              <div>鏃堕棿锛歿formatClock(healthDetail.checked_at)}</div>
              <button type="button" className="admin-health-link" onClick={() => setHealthDetail(null)}>鍏抽棴</button>
            </div>
          ) : null}
        </div>
      </div>
      </>
      ) : null}      {activeSection === "logs" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">鎿嶄綔鏃ュ織</div>
        <div className="admin-console-pagehead-desc">杩借釜鍚庡彴鎿嶄綔璁板綍锛屼究浜庡璁″拰闂鍥炴函銆?/div>
      </div>
      <div id="logs" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>鎿嶄綔鏃ュ織</div>
        <div className="admin-console-table-shell admin-console-logs-table-shell" style={{ overflowX: "auto", maxHeight: 340, minHeight: 220 }}>
          <table className="admin-console-logs-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["鏃堕棿", "鎿嶄綔浜?, "瑙掕壊", "鎿嶄綔", "瀵硅薄", "璇︽儏"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 8px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs.length
                ? logs
                : [{ id: 0, link_id: null, action: "鏆傛棤鎿嶄綔鏃ュ織", actor_username: "-", actor_role: "-", created_at: "-", detail: "-" }]
              ).map((l) => (
                <tr key={l.id}>
                  <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>{formatLogTime(l.created_at)}</td>
                  <td style={{ padding: "9px 8px", fontWeight: 600 }}>{l.actor_username || "-"}</td>
                  <td style={{ padding: "9px 8px" }}>{l.actor_role || "-"}</td>
                  <td style={{ padding: "9px 8px", fontWeight: 600 }}>{l.action || "-"}</td>
                  <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>
                    {l.link_id === null || l.link_id === undefined ? "-" : `link#${l.link_id}`}
                  </td>
                  <td style={{ padding: "9px 8px", minWidth: 240, color: "#475569", wordBreak: "break-all", lineHeight: 1.45 }}>
                    {"detail" in l ? formatLogDetail((l as LinkLog).detail) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : null}

      {user.role === "super" && activeSection === "users" ? (
        <>
        <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
          <div className="admin-console-pagehead-title">鐢ㄦ埛绠＄悊</div>
          <div className="admin-console-pagehead-desc">绠＄悊鍚庡彴璐﹀彿銆佽鑹叉潈闄愬拰鏈€杩戠櫥褰曟儏鍐点€?/div>
        </div>
        <div id="users" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            鐢ㄦ埛绠＄悊锛坰uper锛?
          </div>
          <form onSubmit={submitUser} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="admin-input"
              placeholder="鐢ㄦ埛鍚?
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="瀵嗙爜"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            />
            <select
              className="admin-input"
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value as "super" | "editor" })
              }
            >
              <option value="editor">editor</option>
              <option value="super">super</option>
            </select>
            <button type="submit" className="admin-btn" style={{ padding: "0 12px" }}>
              鍒涘缓鐢ㄦ埛
            </button>
          </form>

          <div className="admin-console-table-shell" style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["ID", "鐢ㄦ埛鍚?, "瑙掕壊", "鍒涘缓鏃堕棿", "鏈€杩戠櫥褰?].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #93C5FD", padding: "8px 6px", color: "#1E3A8A", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.id}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.username}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{u.role}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{String(u.created_at || "").replace("T", " ").slice(0, 19)}</td>
                    <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>
                      {u.last_login_at
                        ? String(u.last_login_at).replace("T", " ").slice(0, 19)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : null}
        </div>
      </div>
    </div>
  );
}





