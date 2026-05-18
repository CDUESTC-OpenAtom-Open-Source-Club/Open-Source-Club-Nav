"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  { id: "popular", label: "热门分类" },
  { id: "health", label: "健康检测" },
  { id: "logs", label: "操作日志" },
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
  const [popular, setPopular] = useState<Array<{ category: string; clicks: number }>>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [loadedSections, setLoadedSections] = useState<Record<string, boolean>>({});
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [trendHovered, setTrendHovered] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);

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
    const statsRes = await fetch("/api/admin/stats");
    if (!statsRes.ok) throw new Error("加载统计失败");
    const statsData = await readJsonSafe<{
      days?: StatDay[];
      trend7?: Array<{ stat_date: string; link_clicks: number }>;
      popularCategories?: Array<{ category: string; clicks: number }>;
    }>(statsRes);
    setStats(statsData?.days || []);
    setTrend7(statsData?.trend7 || []);
    setPopular(statsData?.popularCategories || []);
    markSectionLoaded("popular");
  }, [markSectionLoaded]);

  const loadSystem = useCallback(async () => {
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
    const linksRes = await fetch("/api/admin/links");
    if (!linksRes.ok) throw new Error("加载链接失败");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
    markSectionLoaded("links");
  }, [markSectionLoaded]);

  const loadUsers = useCallback(async () => {
    const usersRes = await fetch("/api/admin/users");
    if (!usersRes.ok) throw new Error("加载用户失败");
    const usersData = await readJsonSafe<{ users?: AdminUser[] }>(usersRes);
    setUsers(usersData?.users || []);
    markSectionLoaded("users");
  }, [markSectionLoaded]);

  const loadHealth = useCallback(async () => {
    const healthRes = await fetch("/api/admin/link-health");
    if (!healthRes.ok) throw new Error("加载健康检测失败");
    const healthData = await readJsonSafe<{ health?: LinkHealth[] }>(healthRes);
    setHealth(healthData?.health || []);
    markSectionLoaded("health");
  }, [markSectionLoaded]);

  const loadLogs = useCallback(async () => {
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
    // 先确认当前登录态，再决定是否进入后台或跳转登录页。
    const init = async () => {
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
  }, [loadLinks, loadOverview, router]);

  // 当前后台是“单页模块切换”模式，这里只切换可见模块，不走路由跳转。
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (!user || loadedSections[sectionId]) return;
    loadSectionById(sectionId, user.role).catch(() => {
      setError("加载模块数据失败");
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

  // 删除后会重新拉取列表，保证表格和统计区同步刷新。
  const removeLink = async (id: number) => {
    await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
    await Promise.all([
      loadLinks(),
      loadLogs().catch(() => {}),
      loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
    ]);
  };

  // 启用/禁用共用同一个更新入口，只切 active 字段。
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
      if (!res.ok) throw new Error(data?.error || "创建用户失败");
      setUserForm({ username: "", password: "", role: "editor" });
      await loadUsers();
    } catch (err) {
      setError(String((err as Error).message || "创建用户失败"));
    }
  };
  const runHealthCheck = async () => {
    setHealthChecking(true);
    try {
      const res = await fetch("/api/admin/link-health", { method: "POST" });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "检测失败");
      await loadHealth();
    } catch (err) {
      setError(String((err as Error).message || "检测失败"));
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
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            管理后台
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            当前用户：{user.username}（{user.role}）
          </div>
        </div>
        <button type="button" onClick={logout} className="admin-btn-ghost">
          退出登录
        </button>
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
          <div className="admin-card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>服务器运行情况</div>
            <div style={{ minHeight: 52, fontSize: 12, color: "#334155", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span>Uptime: {system?.uptimeSec ?? 0}s</span>
              <span>CPU: {system?.cpuCores ?? 0} cores</span>
              <span>内存占用: {system?.mem?.usageRate ?? 0}%</span>
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
              { label: "今日客流量 (PV)", value: today.page_views },
              { label: "今日客流量 (UV)", value: today.unique_visitors },
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
        <div className="admin-console-pagehead-title">热门分类</div>
        <div className="admin-console-pagehead-desc">聚合查看近 7 天点击走势与分类热度表现。</div>
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
        <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>热门分类（域名）</div>
        <div className="admin-console-chart-surface" style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)", display: "grid", gap: 6 }}>
          {(popular.length
            ? popular
            : Array.from({ length: 5 }).map((_, i) => ({ category: `分类${i + 1}`, clicks: 0 }))).map((p) => (
            <div key={p.category} className="admin-console-popular-row" style={{ display: "grid", gridTemplateColumns: "140px 1fr 40px", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#334155", overflow: "hidden", textOverflow: "ellipsis" }}>{p.category}</span>
              <div style={{ height: 8, background: "#DBEAFE", borderRadius: 999 }}>
                <div style={{ width: `${Math.min(100, p.clicks * 10)}%`, height: "100%", background: "#2563EB", borderRadius: 999, opacity: p.clicks ? 1 : 0.25 }} />
              </div>
              <span style={{ fontSize: 12, textAlign: "right" }}>{p.clicks}</span>
            </div>
          ))}
          {!popular.length ? <div style={{ fontSize: 12, color: "#64748B" }}>暂无热门分类数据，图表区域已预留。</div> : null}
        </div>
      </div>
      </>
      ) : null}

      {activeSection === "links" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">内容管理</div>
        <div className="admin-console-pagehead-desc">维护导航链接内容，快速进行新增、启用、禁用和删除操作。</div>
      </div>
      <div id="links" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
          链接管理（editor/super）
        </div>
        <form onSubmit={submitLink} style={{ display: "grid", gap: 8 }}>
          <input
            className="admin-input"
            placeholder="标题"
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
            placeholder="描述"
            value={linkForm.description}
            onChange={(e) =>
              setLinkForm({ ...linkForm, description: e.target.value })
            }
          />
          <input
            className="admin-input"
            type="number"
            placeholder="排序"
            value={linkForm.sort}
            onChange={(e) => setLinkForm({ ...linkForm, sort: Number(e.target.value || 0) })}
            style={{ maxWidth: 140 }}
          />
          <button type="submit" className="admin-btn" style={{ width: 120 }}>
            添加链接
          </button>
        </form>

        <div className="admin-console-table-shell" style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["ID", "标题", "URL", "状态", "操作"].map((h) => (
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
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px" }}>{item.active ? "启用" : "禁用"}</td>
                  <td style={{ borderBottom: "1px solid #F1F5F9", padding: "8px 6px", display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => toggleActive(item)} style={{ border: "1px solid #CBD5E1", background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      {item.active ? "禁用" : "启用"}
                    </button>
                    <button type="button" onClick={() => removeLink(item.id)} style={{ border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                      删除
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
        <div className="admin-console-pagehead-title">健康检测</div>
        <div className="admin-console-pagehead-desc">检测链接可用性，集中查看异常状态和最近检测时间。</div>
      </div>
      <div id="health" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <div className="admin-console-health-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>链接健康检测</div>
          <button type="button" onClick={runHealthCheck} className="admin-btn" style={{ height: 30, padding: "0 10px" }} disabled={healthChecking}>
            {healthChecking ? "检测中..." : "立即检测"}
          </button>
        </div>
        <div style={{ overflowX: "auto", minHeight: 170 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr><th style={{ textAlign: "left" }}>链接</th><th style={{ textAlign: "left" }}>状态</th><th style={{ textAlign: "left" }}>检测时间</th></tr></thead>
            <tbody>
              {(health.length ? health : [{ link_id: 0, title: "暂无检测数据", status_code: null, is_ok: 1, message: "", checked_at: "-" }]).map((h) => (
                <tr key={h.link_id} style={{ background: h.is_ok ? "transparent" : "rgba(254,202,202,0.35)" }}>
                  <td style={{ padding: "6px 4px" }}>{h.title || `#${h.link_id}`}</td>
                  <td style={{ padding: "6px 4px", color: h.is_ok ? "#059669" : "#DC2626", fontWeight: 700 }}>{h.is_ok ? "正常" : `异常 ${h.status_code ?? ""}`}</td>
                  <td style={{ padding: "6px 4px" }}>{String(h.checked_at || "").replace("T", " ").slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            marginTop: 4,
            borderTop: "1px dashed #CBD5E1",
            paddingTop: 10,
            display: "grid",
            gap: 6,
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.65,
          }}
        >
          <div style={{ fontWeight: 700, color: "#0F172A" }}>检测标准说明</div>
          <div>1. 只检测当前处于“启用”状态的友情链接，已禁用链接不会参与探测。</div>
          <div>2. 检测方式为向目标链接发送 `HEAD` 请求，并自动跟随跳转。</div>
          <div>3. 返回状态码在 `200-299` 范围内记为“正常”，其余状态码记为“异常”。</div>
          <div>4. 如果请求超时、域名无法访问、证书异常或网络报错，也会记为“异常”。</div>
          <div>5. 表格展示的是最近一次检测结果，异常行会高亮，便于优先排查。</div>
        </div>
      </div>
      </>
      ) : null}
      {activeSection === "logs" ? (
      <>
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">操作日志</div>
        <div className="admin-console-pagehead-desc">追踪后台操作记录，便于审计和问题回溯。</div>
      </div>
      <div id="logs" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>操作日志</div>
        <div style={{ maxHeight: 220, minHeight: 220, overflow: "auto", fontSize: 12 }}>
          {(logs.length ? logs : [{ id: 0, link_id: null, action: "暂无操作日志", actor_username: "-", actor_role: "-", created_at: "-" }]).map((l) => (
            <div key={l.id} style={{ padding: "6px 0", borderBottom: "1px solid #E2E8F0", display: "grid", gap: 4 }}>
              <div>
                {String(l.created_at).replace("T", " ").slice(0, 19)} - {l.actor_username}({l.actor_role}) {l.action} link#{l.link_id ?? "-"}
              </div>
              {"detail" in l ? (
                <div style={{ color: "#64748B", fontSize: 11, wordBreak: "break-all", lineHeight: 1.45 }}>
                  detail: {formatLogDetail((l as LinkLog).detail)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      </>
      ) : null}

      {user.role === "super" && activeSection === "users" ? (
        <>
        <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
          <div className="admin-console-pagehead-title">用户管理</div>
          <div className="admin-console-pagehead-desc">管理后台账号、角色权限和最近登录情况。</div>
        </div>
        <div id="users" className="admin-card admin-console-section-card admin-console-anchor-card" style={{ padding: 14, display: "grid", gap: 10, background: "rgba(224,237,253,0.95)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.16)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            用户管理（super）
          </div>
          <form onSubmit={submitUser} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="admin-input"
              placeholder="用户名"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="密码"
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
              创建用户
            </button>
          </form>

          <div className="admin-console-table-shell" style={{ overflowX: "auto", background: "rgba(255,255,255,0.68)", border: "1px solid #BFDBFE", borderRadius: 10, padding: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["ID", "用户名", "角色", "创建时间", "最近登录"].map((h) => (
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



