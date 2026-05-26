"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_MODE === "true";

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
type SystemInfo = { uptimeSec: number; cpuCores: number; mem: { usageRate: number } };
type LinkHealth = { link_id: number; title: string; status_code: number | null; is_ok: number; message: string; checked_at: string };
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
  { id: "overview", label: "首页" },
  { id: "links", label: "内容管理" },
  { id: "popular", label: "热门仓库" },
  { id: "health", label: "健康检测" },
  { id: "logs", label: "操作日志" },
] as const;

const MOCK_USER = { id: 1, username: "demo-admin", role: "super" as const };
const MOCK_LINKS: LinkItem[] = [
  { id: 1, title: "React 官方文档", url: "https://react.dev", description: "React 学习入口", sort: 1, active: 1 },
  { id: 2, title: "Next.js 官方文档", url: "https://nextjs.org/docs", description: "Next.js 文档", sort: 2, active: 1 },
  { id: 3, title: "OpenAtom 开源社团仓库", url: "https://github.com/openatom", description: "社团相关项目", sort: 3, active: 1 },
];
const MOCK_USERS: AdminUser[] = [
  { id: 1, username: "demo-admin", role: "super", created_at: "2026-05-01T09:00:00", last_login_at: "2026-05-24T09:42:12" },
  { id: 2, username: "editor-a", role: "editor", created_at: "2026-05-10T14:20:00", last_login_at: "2026-05-23T20:30:02" },
];
const MOCK_STATS: StatDay[] = [
  { stat_date: "2026-05-24", page_views: 1560, unique_visitors: 432, link_clicks: 318 },
];
const MOCK_TREND7 = [
  { stat_date: "2026-05-18", link_clicks: 96 },
  { stat_date: "2026-05-19", link_clicks: 112 },
  { stat_date: "2026-05-20", link_clicks: 84 },
  { stat_date: "2026-05-21", link_clicks: 138 },
  { stat_date: "2026-05-22", link_clicks: 126 },
  { stat_date: "2026-05-23", link_clicks: 174 },
  { stat_date: "2026-05-24", link_clicks: 161 },
];
const MOCK_POPULAR = [
  { repo: "facebook/react", url: "https://github.com/facebook/react", clicks: 174, isValid: true, trend7: [{ stat_date: "2026-05-18", clicks: 18 }, { stat_date: "2026-05-19", clicks: 22 }, { stat_date: "2026-05-20", clicks: 25 }, { stat_date: "2026-05-21", clicks: 19 }, { stat_date: "2026-05-22", clicks: 27 }, { stat_date: "2026-05-23", clicks: 30 }, { stat_date: "2026-05-24", clicks: 33 }] },
  { repo: "vercel/next.js", url: "https://github.com/vercel/next.js", clicks: 161, isValid: true, trend7: [{ stat_date: "2026-05-18", clicks: 14 }, { stat_date: "2026-05-19", clicks: 20 }, { stat_date: "2026-05-20", clicks: 18 }, { stat_date: "2026-05-21", clicks: 24 }, { stat_date: "2026-05-22", clicks: 26 }, { stat_date: "2026-05-23", clicks: 28 }, { stat_date: "2026-05-24", clicks: 31 }] },
  { repo: "reactjs/react.dev", url: "https://github.com/reactjs/react.dev", clicks: 126, isValid: true, trend7: [{ stat_date: "2026-05-18", clicks: 10 }, { stat_date: "2026-05-19", clicks: 12 }, { stat_date: "2026-05-20", clicks: 15 }, { stat_date: "2026-05-21", clicks: 18 }, { stat_date: "2026-05-22", clicks: 20 }, { stat_date: "2026-05-23", clicks: 24 }, { stat_date: "2026-05-24", clicks: 27 }] },
  { repo: "openatom", url: "https://github.com/openatom", clicks: 112, isValid: true, trend7: [{ stat_date: "2026-05-18", clicks: 9 }, { stat_date: "2026-05-19", clicks: 11 }, { stat_date: "2026-05-20", clicks: 13 }, { stat_date: "2026-05-21", clicks: 15 }, { stat_date: "2026-05-22", clicks: 18 }, { stat_date: "2026-05-23", clicks: 22 }, { stat_date: "2026-05-24", clicks: 24 }] },
  { repo: "nodejs/node", url: "https://github.com/nodejs/node", clicks: 84, isValid: true, trend7: [{ stat_date: "2026-05-18", clicks: 6 }, { stat_date: "2026-05-19", clicks: 8 }, { stat_date: "2026-05-20", clicks: 11 }, { stat_date: "2026-05-21", clicks: 12 }, { stat_date: "2026-05-22", clicks: 14 }, { stat_date: "2026-05-23", clicks: 15 }, { stat_date: "2026-05-24", clicks: 18 }] },
];

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

function getActionTag(action: string): { text: string; fg: string; bg: string } {
  const raw = String(action || "").toLowerCase();
  if (raw.includes("create") || raw.includes("add") || raw.includes("新增")) {
    return { text: "新增", fg: "#0F766E", bg: "#CCFBF1" };
  }
  if (raw.includes("update") || raw.includes("edit") || raw.includes("修改")) {
    return { text: "修改", fg: "#1D4ED8", bg: "#DBEAFE" };
  }
  if (raw.includes("delete") || raw.includes("remove") || raw.includes("删除")) {
    return { text: "删除", fg: "#B91C1C", bg: "#FEE2E2" };
  }
  if (raw.includes("disable") || raw.includes("禁用")) {
    return { text: "禁用", fg: "#9A3412", bg: "#FFEDD5" };
  }
  if (raw.includes("enable") || raw.includes("启用")) {
    return { text: "启用", fg: "#166534", bg: "#DCFCE7" };
  }
  if (raw.includes("login") || raw.includes("登录")) {
    return { text: "登录", fg: "#334155", bg: "#E2E8F0" };
  }
  if (raw.includes("logout") || raw.includes("退出")) {
    return { text: "退出", fg: "#334155", bg: "#E2E8F0" };
  }
  return { text: action || "-", fg: "#475569", bg: "#F1F5F9" };
}

function RepoTrendSparkline({
  points,
}: {
  points: Array<{ stat_date: string; clicks: number }>;
}) {
  const width = 132;
  const height = 34;
  const safePoints = points.length
    ? points
    : Array.from({ length: 7 }).map((_, index) => ({
        stat_date: `D${index + 1}`,
        clicks: 0,
      }));
  const maxValue = Math.max(1, ...safePoints.map((item) => item.clicks || 0));
  const stepX = safePoints.length > 1 ? width / (safePoints.length - 1) : width / 2;
  const mapped = safePoints.map((item, index) => ({
    ...item,
    x: safePoints.length === 1 ? width / 2 : index * stepX,
    y: height - ((item.clicks || 0) / maxValue) * (height - 8) - 4,
  }));
  const linePath = mapped.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = mapped.length
    ? `${linePath} L ${mapped[mapped.length - 1].x.toFixed(2)} ${height} L ${mapped[0].x.toFixed(2)} ${height} Z`
    : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: 132, height: 34, display: "block" }} aria-label="近7天点击曲线">
      <defs>
        <linearGradient id="repoTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {areaPath ? <path d={areaPath} fill="url(#repoTrendFill)" /> : null}
      {linePath ? <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {mapped.map((point) => (
        <circle key={`${point.stat_date}-${point.x}`} cx={point.x} cy={point.y} r="2.4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
      ))}
    </svg>
  );
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
  const [popular, setPopular] = useState<Array<{ repo: string; url: string; clicks: number; trend7: Array<{ stat_date: string; clicks: number }>; isValid: boolean | null }>>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [loadedSections, setLoadedSections] = useState<Record<string, boolean>>({});
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [trendHovered, setTrendHovered] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [autoDetectDialogOpen, setAutoDetectDialogOpen] = useState(false);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const [autoDetectIntervalMinutes, setAutoDetectIntervalMinutes] = useState(15);
  const [autoDetectDraftMinutes, setAutoDetectDraftMinutes] = useState("15");
  const [lastAutoDetectAt, setLastAutoDetectAt] = useState<string | null>(null);

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
  const AUTO_DETECT_ENABLED_KEY = "kcos_admin_auto_detect_enabled";
  const AUTO_DETECT_INTERVAL_KEY = "kcos_admin_auto_detect_interval_minutes";
  const AUTO_DETECT_LAST_RUN_KEY = "kcos_admin_auto_detect_last_run_at";

  // 顶部 KPI 默认取最新一天，没有数据时回退到空统计。
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
      ? [...baseSections, { id: "users", label: "用户管理" as const }]
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

  const markSectionLoaded = useCallback((sectionId: string) => {
    setLoadedSections((prev) => (prev[sectionId] ? prev : { ...prev, [sectionId]: true }));
  }, []);

  const loadStats = useCallback(async () => {
    if (MOCK_MODE) {
      setStats(MOCK_STATS);
      setTrend7(MOCK_TREND7);
      setPopular(MOCK_POPULAR);
      markSectionLoaded("popular");
      return;
    }
    const statsRes = await fetch("/api/admin/stats");
    if (!statsRes.ok) throw new Error("加载统计失败");
    const statsData = await readJsonSafe<{
      days?: StatDay[];
      trend7?: Array<{ stat_date: string; link_clicks: number }>;
      popularCategories?: Array<{ repo: string; url: string; clicks: number; trend7: Array<{ stat_date: string; clicks: number }>; isValid: boolean | null }>;
    }>(statsRes);
    setStats(statsData?.days || []);
    setTrend7(statsData?.trend7 || []);
    setPopular(statsData?.popularCategories || []);
    markSectionLoaded("popular");
  }, [markSectionLoaded]);

  const loadSystem = useCallback(async () => {
    if (MOCK_MODE) {
      setSystem({ uptimeSec: 73842, cpuCores: 8, mem: { usageRate: 42 } });
      return;
    }
    const sysRes = await fetch("/api/admin/system");
    if (!sysRes.ok) throw new Error("加载系统信息失败");
    const systemData = await readJsonSafe<SystemInfo>(sysRes);
    setSystem(systemData);
  }, []);

  const loadOverview = useCallback(async () => {
    await Promise.all([loadStats(), loadSystem()]);
    markSectionLoaded("overview");
  }, [loadStats, loadSystem, markSectionLoaded]);

  const loadLinks = useCallback(async () => {
    if (MOCK_MODE) {
      setLinks(MOCK_LINKS);
      markSectionLoaded("links");
      return;
    }
    const linksRes = await fetch("/api/admin/links");
    if (!linksRes.ok) throw new Error("加载链接失败");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
    markSectionLoaded("links");
  }, [markSectionLoaded]);

  const loadUsers = useCallback(async () => {
    if (MOCK_MODE) {
      setUsers(MOCK_USERS);
      markSectionLoaded("users");
      return;
    }
    const usersRes = await fetch("/api/admin/users");
    if (!usersRes.ok) throw new Error("加载用户失败");
    const usersData = await readJsonSafe<{ users?: AdminUser[] }>(usersRes);
    setUsers(usersData?.users || []);
    markSectionLoaded("users");
  }, [markSectionLoaded]);

  const loadHealth = useCallback(async () => {
    if (MOCK_MODE) {
      setHealth([
        { link_id: 1, title: "React 官方文档", status_code: 200, is_ok: 1, message: "ok", checked_at: "2026-05-24T10:10:00" },
        { link_id: 2, title: "Next.js 官方文档", status_code: 200, is_ok: 1, message: "ok", checked_at: "2026-05-24T10:10:10" },
        { link_id: 3, title: "OpenAtom 开源社团仓库", status_code: 503, is_ok: 0, message: "Service Unavailable", checked_at: "2026-05-24T10:10:20" },
      ]);
      markSectionLoaded("health");
      return;
    }
    const healthRes = await fetch("/api/admin/link-health");
    if (!healthRes.ok) throw new Error("加载健康检测失败");
    const healthData = await readJsonSafe<{ health?: LinkHealth[] }>(healthRes);
    setHealth(healthData?.health || []);
    markSectionLoaded("health");
  }, [markSectionLoaded]);

  const loadLogs = useCallback(async () => {
    if (MOCK_MODE) {
      setLogs([
        { id: 1, link_id: 1, action: "create link", actor_username: "demo-admin", actor_role: "super", created_at: "2026-05-24T09:15:00", detail: { title: "React 官方文档" } },
        { id: 2, link_id: 3, action: "disable link", actor_username: "editor-a", actor_role: "editor", created_at: "2026-05-24T09:36:00", detail: { reason: "探测失败" } },
        { id: 3, link_id: 2, action: "update link", actor_username: "demo-admin", actor_role: "super", created_at: "2026-05-24T10:01:00", detail: { field: "description" } },
      ]);
      markSectionLoaded("logs");
      return;
    }
    const logRes = await fetch("/api/admin/logs");
    if (!logRes.ok) throw new Error("加载日志失败");
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
      if (MOCK_MODE) {
        setUser(MOCK_USER);
        await Promise.all([loadOverview(), loadLinks(), loadUsers(), loadHealth(), loadLogs()]);
        setLoadedSections({ overview: true, popular: true, links: true, users: true, health: true, logs: true });
        setChecking(false);
        return;
      }
      try {
        const meRes = await fetch("/api/admin/me");
        if (!meRes.ok) {
          router.replace("/admin/login");
          return;
        }
        const me = await readJsonSafe<{ user?: { id: number; username: string; role: "super" | "editor" } }>(meRes);
        if (!me?.user) {
          throw new Error("登录态异常");
        }
        setUser(me.user);
        await Promise.all([loadOverview(), loadLinks()]);
        setLoadedSections({ overview: true, popular: true, links: true });
      } catch {
        setError("加载后台数据失败");
      } finally {
        setChecking(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当前后台为单页模块切换模式，这里只切换可见模块。
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (!user || loadedSections[sectionId]) return;
    loadSectionById(sectionId, user.role).catch(() => {
      setError("加载模块数据失败");
    });
  };

  const logout = async () => {
    if (MOCK_MODE) {
      router.replace("/admin/login");
      return;
    }
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  };

  const submitLink = async (e: FormEvent) => {
    e.preventDefault();
    if (MOCK_MODE) {
      const nextId = links.length ? Math.max(...links.map((x) => x.id)) + 1 : 1;
      setLinks((prev) => [...prev, { id: nextId, ...linkForm, active: 1 }]);
      setLinkForm({ title: "", url: "", description: "", sort: 0 });
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkForm),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "新增链接失败");
      setLinkForm({ title: "", url: "", description: "", sort: 0 });
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
        loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "新增链接失败"));
    }
  };

  // 删除后重新拉取列表，确保表格和统计区域同步刷新。
  const removeLink = async (id: number) => {
    if (MOCK_MODE) {
      setLinks((prev) => prev.filter((x) => x.id !== id));
      return;
    }
    await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
    await Promise.all([
      loadLinks(),
      loadLogs().catch(() => {}),
      loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
    ]);
  };

  // 启用/禁用共用同一个更新入口，仅切换 active 字段。
  const toggleActive = async (item: LinkItem) => {
    if (MOCK_MODE) {
      setLinks((prev) => prev.map((x) => (x.id === item.id ? { ...x, active: x.active ? 0 : 1 } : x)));
      return;
    }
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
    if (MOCK_MODE) {
      const nextId = users.length ? Math.max(...users.map((x) => x.id)) + 1 : 1;
      setUsers((prev) => [...prev, { id: nextId, username: userForm.username, role: userForm.role, created_at: new Date().toISOString(), last_login_at: null }]);
      setUserForm({ username: "", password: "", role: "editor" });
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "创建用户失败");
      setUserForm({ username: "", password: "", role: "editor" });
      await loadUsers();
    } catch (err) {
      setError(String((err as Error).message || "创建用户失败"));
    }
  };
  const runHealthCheck = async () => {
    if (healthChecking) return;
    if (MOCK_MODE) {
      setHealthChecking(true);
      setTimeout(() => {
        setHealth((prev) => prev.map((h) => {
          const ok = Math.random() > 0.2;
          return { ...h, is_ok: ok ? 1 : 0, status_code: ok ? 200 : 503, checked_at: new Date().toISOString() };
        }));
        const nowIso = new Date().toISOString();
        setLastAutoDetectAt(nowIso);
        setHealthChecking(false);
      }, 600);
      return;
    }
    setHealthChecking(true);
    try {
      const res = await fetch("/api/admin/link-health", { method: "POST" });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "检测失败");
      await loadHealth();
      const nowIso = new Date().toISOString();
      setLastAutoDetectAt(nowIso);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTO_DETECT_LAST_RUN_KEY, nowIso);
      }
    } catch (err) {
      setError(String((err as Error).message || "检测失败"));
    } finally {
      setHealthChecking(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEnabled = window.localStorage.getItem(AUTO_DETECT_ENABLED_KEY);
    const storedMinutes = window.localStorage.getItem(AUTO_DETECT_INTERVAL_KEY);
    const storedLastRun = window.localStorage.getItem(AUTO_DETECT_LAST_RUN_KEY);
    if (storedEnabled === "true") {
      setAutoDetectEnabled(true);
    }
    if (storedMinutes) {
      const parsed = Number(storedMinutes);
      if (Number.isFinite(parsed) && parsed >= 1) {
        setAutoDetectIntervalMinutes(parsed);
        setAutoDetectDraftMinutes(String(parsed));
      }
    }
    if (storedLastRun) {
      setLastAutoDetectAt(storedLastRun);
    }
  }, []);

  useEffect(() => {
    if (!autoDetectEnabled || autoDetectIntervalMinutes < 1) return;
    const intervalId = window.setInterval(() => {
      void runHealthCheck();
    }, autoDetectIntervalMinutes * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [autoDetectEnabled, autoDetectIntervalMinutes, healthChecking]);

  const openAutoDetectDialog = () => {
    setAutoDetectDraftMinutes(String(autoDetectIntervalMinutes));
    setAutoDetectDialogOpen(true);
  };

  const saveAutoDetectSettings = () => {
    const nextMinutes = Number(autoDetectDraftMinutes);
    if (!Number.isFinite(nextMinutes) || nextMinutes < 1) {
      setError("自动探测时间必须是大于等于 1 的分钟数");
      return;
    }
    setError("");
    setAutoDetectIntervalMinutes(nextMinutes);
    setAutoDetectEnabled(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_DETECT_ENABLED_KEY, "true");
      window.localStorage.setItem(AUTO_DETECT_INTERVAL_KEY, String(nextMinutes));
    }
    setAutoDetectDialogOpen(false);
  };

  const stopAutoDetect = () => {
    setAutoDetectEnabled(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_DETECT_ENABLED_KEY, "false");
    }
    setAutoDetectDialogOpen(false);
  };

  if (checking) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="admin-shell" style={{ display: "grid", gap: 12, position: "relative", zIndex: 1 }}>
      <div className="admin-console-layout">
        <aside className="admin-console-sidebar">
          <div className="admin-console-side-title">控制台</div>
          {/* 左侧菜单只负责切换模块，不承载路由状态。 */}
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
      {/* 这一块保留为后台统一头部，所有模块切换时都显示。 */}
      <div id="overview" className="admin-card admin-console-anchor-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "rgba(226,238,252,0.94)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.18)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>管理后台</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>当前用户：{user.username}（{user.role}）</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => router.push("/")} className="admin-btn-ghost">
            返回首页
          </button>
          <button type="button" onClick={logout} className="admin-btn-ghost">
            退出登录
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ color: "#DC2626", fontSize: 12 }}>{error}</div>
      ) : null}
      {/* 每次只渲染一个模块，减少信息堆叠，保持后台单页切换体验。 */}
      {activeSection === "overview" ? (
        <>
          <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
            <div className="admin-console-pagehead-title">首页总览</div>
            <div className="admin-console-pagehead-desc">查看系统运行状态、今日访问数据和后台全局摘要。</div>
          </div>
          <div className="admin-card" style={{ padding: 16, background: "linear-gradient(135deg,#FFFFFF 0%,#F3F8FF 55%,#EEF6FF 100%)", border: "1px solid #DCE8F8", boxShadow: "0 14px 28px rgba(37,99,235,0.08)" }}>
            <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>服务器运行情况</div>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 14, alignItems: "center" }}>
              <div style={{ display: "grid", placeItems: "center" }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `conic-gradient(#3B82F6 ${Math.min(100, Math.round((system?.uptimeSec ?? 0) / 1000))}%, #E2E8F0 0)`,
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 10px 24px rgba(59,130,246,0.25)",
                  }}
                >
                  <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#fff", border: "1px solid #DBEAFE", display: "grid", placeItems: "center", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>运行时长</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1D4ED8" }}>{Math.floor((system?.uptimeSec ?? 0) / 3600)}h</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 12, color: "#334155", display: "flex", justifyContent: "space-between" }}>
                    <span>CPU 核心数</span>
                    <span>{system?.cpuCores ?? 0} cores</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, ((system?.cpuCores ?? 0) / 32) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#60A5FA,#2563EB)" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 12, color: "#334155", display: "flex", justifyContent: "space-between" }}>
                    <span>内存占用</span>
                    <span>{system?.mem?.usageRate ?? 0}%</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, system?.mem?.usageRate ?? 0)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22D3EE,#0EA5E9)" }} />
                  </div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: "#64748B", display: "flex", justifyContent: "space-between" }}>
                  <span>实例状态：运行中</span>
                  <span>Uptime: {system?.uptimeSec ?? 0}s</span>
                </div>
              </div>
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
              { label: "今日访问量 (PV)", value: today.page_views },
              { label: "今日访客数 (UV)", value: today.unique_visitors },
              { label: "今日点击量", value: today.link_clicks },
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
        <div className="admin-console-pagehead-title">热门仓库</div>
        <div className="admin-console-pagehead-desc">聚合查看近 7 天点击走势与仓库热度表现。</div>
      </div>
      <div id="popular" className="admin-card admin-console-chart-card admin-console-anchor-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>近7天点击走势</div>
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
                点击量 {lineChart.points[hoveredTrendIndex].link_clicks}
              </div>
            </div>
          ) : null}
          <svg
            viewBox={`0 0 ${lineChart.width} ${lineChart.height}`}
            style={{ width: "100%", height: 220, display: "block", overflow: "visible" }}
            aria-label="近7天点击走势折线图"
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
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>暂无 7 天点击数据，图表区域已预留。</div>
          ) : null}
        </div>
        <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>热门仓库（点击量）</div>
        <div className="admin-console-chart-surface" style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)" }}>
          <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFD" }}>
                  <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>仓库名</th>
                  <th style={{ textAlign: "right", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>近 7 天总点击量</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>近 7 天点击量统计图</th>
                  <th style={{ textAlign: "center", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>当前状态</th>
                </tr>
              </thead>
              <tbody>
                {(popular.length
                  ? popular
                  : Array.from({ length: 5 }).map((_, i) => ({ repo: `仓库${i + 1}`, url: "", clicks: 0, trend7: [], isValid: null }))).map((p, idx) => (
                  <tr key={`${p.repo}-${idx}`}>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155", fontWeight: 700, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(p.repo)}>
                      {p.repo || "-"}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid #F1F5F9",
                        textAlign: "center",
                        color: "#1D4ED8",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.clicks}
                    </td>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid #F1F5F9" }}>
                      <RepoTrendSparkline points={p.trend7 || []} />
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 88,
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          color: p.isValid === true ? "#166534" : p.isValid === false ? "#B91C1C" : "#64748B",
                          background: p.isValid === true ? "#DCFCE7" : p.isValid === false ? "#FEE2E2" : "#F1F5F9",
                          border: `1px solid ${p.isValid === true ? "#86EFAC" : p.isValid === false ? "#FCA5A5" : "#CBD5E1"}`,
                        }}
                      >
                        {p.isValid === true ? "有效仓库" : p.isValid === false ? "链接异常" : "待检测"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!popular.length ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "14px", color: "#64748B" }}>
                      暂无热门仓库数据，图表区域已预留。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      ) : null}


      {activeSection === "links" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">内容管理</div>
        <div className="admin-console-pagehead-desc">维护导航链接，支持新增、启用、禁用和删除。</div>
      </div>
      <div id="links" className="admin-card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <form onSubmit={submitLink} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1.2fr 1fr 120px 120px" }}>
          <input className="admin-input" placeholder="标题" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
          <input className="admin-input" placeholder="URL" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
          <input className="admin-input" placeholder="描述" value={linkForm.description} onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })} />
          <input className="admin-input" type="number" placeholder="排序" value={linkForm.sort} onChange={(e) => setLinkForm({ ...linkForm, sort: Number(e.target.value || 0) })} />
          <button type="submit" className="admin-btn">添加链接</button>
        </form>
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFD" }}>
                {["ID", "标题", "URL", "状态", "操作"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{item.id}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{item.title}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{item.url}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: item.active ? "#059669" : "#DC2626", fontWeight: 600 }}>{item.active ? "启用" : "禁用"}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => toggleActive(item)} className="admin-btn-ghost">{item.active ? "禁用" : "启用"}</button>
                    <button type="button" onClick={() => removeLink(item.id)} className="admin-btn-ghost" style={{ color: "#B91C1C", borderColor: "#FCA5A5" }}>删除</button>
                  </td>
                </tr>
              ))}
              {!links.length ? (
                <tr><td colSpan={5} style={{ padding: "14px", color: "#64748B" }}>暂无链接数据</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : null}

      {activeSection === "health" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 18, border: "1px solid #E6ECF5", background: "linear-gradient(180deg,#FFFFFF 0%,#F8FBFF 100%)" }}>
        <div className="admin-console-pagehead-title">链接健康检测</div>
        <div className="admin-console-pagehead-desc">监控链接可用性、异常比例与最近探测结果。</div>
      </div>
      <div id="health" className="admin-card" style={{ padding: 20, background: "#F3F6FA", border: "1px solid #E6ECF5", borderRadius: 12, display: "grid", gap: 16, boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14, boxShadow: "inset 0 0 0 1px rgba(24,144,255,0.06)" }}>
            <div style={{ fontSize: 12, color: "#64748B", letterSpacing: 0.2 }}>健康度评分</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1890FF" }}>
              {health.length ? `${Math.round((health.filter((h) => h.is_ok).length / health.length) * 100)}%` : "100%"}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>总监控项</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{health.length}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>正常</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>{health.filter((h) => h.is_ok).length}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>异常</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{health.filter((h) => !h.is_ok).length}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>监控对象状态面板</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              {autoDetectEnabled
                ? `自动探测已开启：每 ${autoDetectIntervalMinutes} 分钟执行一次${lastAutoDetectAt ? `，最近一次 ${lastAutoDetectAt.replace("T", " ").slice(0, 19)}` : ""}`
                : "自动探测未开启"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={openAutoDetectDialog}
              className="admin-btn-ghost"
              style={{ height: 34, padding: "0 14px", borderRadius: 8, borderColor: autoDetectEnabled ? "#86EFAC" : "#CBD5E1", color: autoDetectEnabled ? "#166534" : "#334155" }}
            >
              自动探测
            </button>
            <button type="button" onClick={runHealthCheck} className="admin-btn" style={{ height: 34, padding: "0 14px", borderRadius: 8 }} disabled={healthChecking}>
              {healthChecking ? "探测中..." : "全量探测"}
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFD" }}>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>监控对象</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>探测状态</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>最近探测时间</th>
              </tr>
            </thead>
            <tbody>
              {(health.length ? health : [{ link_id: 0, title: "暂无数据", status_code: null, is_ok: 1, message: "", checked_at: "-" }]).map((h) => (
                <tr key={h.link_id} style={{ background: h.is_ok ? "#fff" : "#FFF1F0" }}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#0F172A" }}>{h.title || `#${h.link_id}`}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ color: h.is_ok ? "#059669" : "#DC2626", fontWeight: 700 }}>
                      {h.is_ok ? "● 运行正常" : "● 服务不可用"}
                    </span>
                    {!h.is_ok && h.status_code ? <span style={{ marginLeft: 8, fontSize: 12, background: "#F3F4F6", padding: "2px 8px", borderRadius: 999, color: "#475569" }}>HTTP {h.status_code}</span> : null}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155" }} title={String(h.checked_at || "")}>
                    {String(h.checked_at || "").replace("T", " ").slice(0, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : null}

      {activeSection === "logs" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 18, border: "1px solid #E6ECF5", background: "linear-gradient(180deg,#FFFFFF 0%,#F9FBFF 100%)" }}>
        <div className="admin-console-pagehead-title">操作日志</div>
        <div className="admin-console-pagehead-desc">按时间、操作人、动作和目标追踪后台行为。</div>
      </div>
      <div className="admin-card" style={{ padding: 16, background: "#F5F7FA", border: "1px solid #E6ECF5", borderRadius: 12 }}>
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
            <thead>
              <tr style={{ background: "#F8FAFD" }}>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>时间</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>操作人</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>角色</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>动作</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>对象</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>详情</th>
              </tr>
            </thead>
            <tbody>
              {(logs.length ? logs : [{ id: 0, link_id: null, action: "暂无操作日志", actor_username: "-", actor_role: "-", created_at: "-" }]).map((l) => (
                <tr key={l.id}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155", whiteSpace: "nowrap" }}>
                    {String(l.created_at || "").replace("T", " ").slice(0, 19)}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#0F172A", fontWeight: 600 }}>
                    {l.actor_username || "-"}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ fontSize: 12, color: "#475569", background: "#F1F5F9", borderRadius: 999, padding: "2px 8px" }}>
                      {l.actor_role || "-"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: 999,
                        padding: "2px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: getActionTag(l.action).fg,
                        background: getActionTag(l.action).bg,
                      }}
                      title={l.action || "-"}
                    >
                      {getActionTag(l.action).text}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155" }}>
                    {l.link_id ? `link#${l.link_id}` : "-"}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#64748B", maxWidth: 360, wordBreak: "break-all", lineHeight: 1.5 }}>
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
        <div className="admin-console-pagehead-title">用户管理</div>
        <div className="admin-console-pagehead-desc">管理后台账号、角色权限和最近登录时间。</div>
      </div>
      <div id="users" className="admin-card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <form onSubmit={submitUser} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 140px 120px" }}>
          <input className="admin-input" placeholder="用户名" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
          <input className="admin-input" type="password" placeholder="密码" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <select className="admin-input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "super" | "editor" })}>
            <option value="editor">editor</option>
            <option value="super">super</option>
          </select>
          <button type="submit" className="admin-btn">创建用户</button>
        </form>
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFD" }}>
                {["ID", "用户名", "角色", "创建时间", "最近登录"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{u.id}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{u.username}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{u.role}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{String(u.created_at || "").replace("T", " ").slice(0, 19)}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{u.last_login_at ? String(u.last_login_at).replace("T", " ").slice(0, 19) : "-"}</td>
                </tr>
              ))}
              {!users.length ? (
                <tr><td colSpan={5} style={{ padding: "14px", color: "#64748B" }}>暂无用户数据</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : null}
        </div>
      </div>

      {autoDetectDialogOpen ? (
        <div
          onClick={() => setAutoDetectDialogOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
              padding: 18,
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>自动探测设置</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                设定定期触发的分钟间隔。开启后将在当前控制台会话中自动执行全量探测，并持久化到浏览器本地。
              </div>
            </div>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>每隔多少分钟自动探测一次</span>
              <input
                className="admin-input"
                type="number"
                min={1}
                step={1}
                value={autoDetectDraftMinutes}
                onChange={(e) => setAutoDetectDraftMinutes(e.target.value)}
                placeholder="例如 15"
              />
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={stopAutoDetect}
                className="admin-btn-ghost"
                style={{ color: "#B91C1C", borderColor: "#FCA5A5" }}
              >
                关闭自动探测
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setAutoDetectDialogOpen(false)} className="admin-btn-ghost">
                  取消
                </button>
                <button type="button" onClick={saveAutoDetectSettings} className="admin-btn">
                  保存并开启
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
