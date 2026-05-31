"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BarChart3, Clock3, Eye, LayoutDashboard, MousePointerClick, ServerCog, Users } from "lucide-react";
import { MOCK_HEALTH } from "@/data/mock/health";
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
  module: NavModule;
  resource_sub_module?: ResourceSubModule;
  game_type?: "internal" | "external";
  click_count?: number;
  created_at?: string | null;
};

type NavModule = "resource_matrix" | "friend_links" | "mini_games";
type ResourceSubModule = "think_tank" | "campus" | "tools";

const NAV_MODULE_META: Record<NavModule, { label: string; short: string }> = {
  resource_matrix: { label: "资源矩阵", short: "资源" },
  friend_links: { label: "友情链接", short: "友链" },
  mini_games: { label: "小游戏", short: "游戏" },
};
const RESOURCE_SUB_MODULE_META: Record<ResourceSubModule, { label: string; short: string }> = {
  think_tank: { label: "智库", short: "智库" },
  campus: { label: "校园", short: "校园" },
  tools: { label: "工具", short: "工具" },
};

type StatDay = {
  stat_date: string;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
};
type HourStat = {
  hour: number;
  page_views: number;
  unique_visitors: number;
  link_clicks: number;
};
type StatMetricKey = "link_clicks" | "page_views" | "unique_visitors";
type SystemInfo = { uptimeSec: number; cpuCores: number; mem: { usageRate: number } };
type LinkHealth = { link_id: number; title: string; status_code: number | null; is_ok: number; message: string; checked_at: string };
type LinkLog = {
  id: number;
  link_id: number | null;
  link_title?: string | null;
  action: string;
  actor_username: string;
  actor_role: string;
  created_at: string;
  detail?: unknown;
};

const STAT_METRIC_META: Record<StatMetricKey, { label: string; short: string; color: string; bg: string }> = {
  link_clicks: { label: "点击量", short: "点击", color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  page_views: { label: "访问量", short: "访问", color: "#0EA5E9", bg: "rgba(14,165,233,0.12)" },
  unique_visitors: { label: "访客数", short: "访客", color: "#059669", bg: "rgba(5,150,105,0.12)" },
};

const baseSections = [
  { id: "overview", label: "首页" },
  { id: "links", label: "内容管理" },
  { id: "popular", label: "热门仓库" },
  { id: "health", label: "健康检测" },
  { id: "logs", label: "操作日志" },
] as const;

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
const MOCK_HOURLY24: HourStat[] = Array.from({ length: 24 }).map((_, hour) => {
  const pvSamples = [24, 18, 15, 11, 10, 15, 29, 44, 62, 76, 71, 79, 90, 96, 91, 85, 78, 74, 67, 61, 54, 47, 38, 30];
  const uvSamples = [9, 8, 6, 5, 5, 7, 13, 21, 30, 35, 33, 38, 42, 45, 43, 40, 36, 34, 31, 28, 24, 21, 17, 13];
  const clickSamples = [7, 6, 5, 4, 4, 6, 10, 15, 21, 26, 24, 29, 33, 35, 34, 31, 28, 27, 24, 22, 20, 17, 14, 11];
  return {
    hour,
    page_views: pvSamples[hour],
    unique_visitors: uvSamples[hour],
    link_clicks: clickSamples[hour],
  };
});
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
  if (raw.includes("health") || raw.includes("检测")) {
    return { text: "健康检测", fg: "#0C4A6E", bg: "#E0F2FE" };
  }
  if (raw.includes("user") || raw.includes("用户")) {
    return { text: "用户操作", fg: "#7C2D12", bg: "#FFEDD5" };
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
  const [hourly24, setHourly24] = useState<HourStat[]>([]);
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
  const [activeLinkModule, setActiveLinkModule] = useState<NavModule>("resource_matrix");
  const [activeResourceSubModule, setActiveResourceSubModule] = useState<ResourceSubModule>("think_tank");
  const [linksNavExpanded, setLinksNavExpanded] = useState(false);
  const [activeStatMetric, setActiveStatMetric] = useState<StatMetricKey>("link_clicks");
  const [statRange, setStatRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [hoveredMonthlyIndex, setHoveredMonthlyIndex] = useState<number | null>(null);
  const [hoveredHourlyIndex, setHoveredHourlyIndex] = useState<number | null>(null);
  const [mockLinksResetDone, setMockLinksResetDone] = useState(false);

  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    description: "",
    sort: 0,
    module: "resource_matrix" as NavModule,
    resource_sub_module: "think_tank" as ResourceSubModule,
  });
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "editor" as "editor" | "super",
  });
  const [userPasswordDrafts, setUserPasswordDrafts] = useState<Record<number, string>>({});
  const AUTO_DETECT_ENABLED_KEY = "kcos_admin_auto_detect_enabled";
  const AUTO_DETECT_INTERVAL_KEY = "kcos_admin_auto_detect_interval_minutes";
  const AUTO_DETECT_LAST_RUN_KEY = "kcos_admin_auto_detect_last_run_at";

  // 今日 KPI（无数据时使用零值占位）
  const today = useMemo(
    () =>
      stats[stats.length - 1] || {
        stat_date: new Date().toISOString().slice(0, 10),
        page_views: 0,
        unique_visitors: 0,
        link_clicks: 0,
      },
    [stats],
  );

  const hourlyStats = useMemo(() => {
    const rowMap = new Map(hourly24.map((item) => [Number(item.hour), item]));
    return Array.from({ length: 24 }).map((_, hour) => {
      const row = rowMap.get(hour);
      return {
        hour,
        page_views: Number(row?.page_views || 0),
        unique_visitors: Number(row?.unique_visitors || 0),
        link_clicks: Number(row?.link_clicks || 0),
      };
    });
  }, [hourly24]);

  const hourlyOverview = useMemo(() => {
    const totals = hourlyStats.reduce(
      (acc, item) => ({
        page_views: acc.page_views + item.page_views,
        unique_visitors: acc.unique_visitors + item.unique_visitors,
        link_clicks: acc.link_clicks + item.link_clicks,
      }),
      { page_views: 0, unique_visitors: 0, link_clicks: 0 },
    );
    const hovered = hoveredHourlyIndex === null ? null : hourlyStats[hoveredHourlyIndex] || null;
    return { totals, hovered };
  }, [hourlyStats, hoveredHourlyIndex]);

  const hourlyLineChart = useMemo(() => {
    const metricKeys: StatMetricKey[] = ["page_views", "unique_visitors", "link_clicks"];
    const width = 980;
    const height = 286;
    const padding = { top: 20, right: 20, bottom: 30, left: 38 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(
      5,
      ...hourlyStats.flatMap((item) => [item.page_views, item.unique_visitors, item.link_clicks]),
    );
    const stepX = hourlyStats.length > 1 ? innerWidth / (hourlyStats.length - 1) : innerWidth;

    const pointsByMetric = metricKeys.reduce(
      (acc, metricKey) => {
        acc[metricKey] = hourlyStats.map((item, index) => {
          const value = Number(item[metricKey] || 0);
          const x = padding.left + (hourlyStats.length === 1 ? innerWidth / 2 : stepX * index);
          const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
          return { hour: item.hour, value, x, y };
        });
        return acc;
      },
      {} as Record<StatMetricKey, Array<{ hour: number; value: number; x: number; y: number }>>,
    );

    const buildSmoothPath = (list: Array<{ x: number; y: number }>) => {
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

    const linePathByMetric = metricKeys.reduce(
      (acc, metricKey) => {
        acc[metricKey] = buildSmoothPath(pointsByMetric[metricKey]);
        return acc;
      },
      {} as Record<StatMetricKey, string>,
    );

    const yTicks = Array.from({ length: 5 }).map((_, index) => {
      const value = Math.round((maxValue / 4) * (4 - index));
      const y = padding.top + (innerHeight / 4) * index;
      return { value, y };
    });
    const xTicks = [0, 4, 8, 12, 16, 20, 23];

    return {
      metricKeys,
      width,
      height,
      padding,
      innerHeight,
      maxValue,
      pointsByMetric,
      linePathByMetric,
      yTicks,
      xTicks,
    };
  }, [hourlyStats]);

  const sections = useMemo(
    () => (user && user.role === "super"
      ? [...baseSections, { id: "users", label: "用户管理" as const }]
      : baseSections),
    [user],
  );

  useEffect(() => {
    if (user?.role !== "super" && activeSection === "users") {
      setActiveSection("overview");
    }
  }, [activeSection, user]);

  const healthMapByLinkId = useMemo(() => {
    const map = new Map<number, LinkHealth>();
    for (const item of health) {
      if (!map.has(item.link_id)) {
        map.set(item.link_id, item);
      }
    }
    return map;
  }, [health]);

  const monthlyStats = useMemo(() => {
    const sorted = [...stats].sort((a, b) => String(a.stat_date).localeCompare(String(b.stat_date)));
    const latestDate = sorted.length
      ? new Date(`${sorted[sorted.length - 1].stat_date}T00:00:00`)
      : new Date();
    const monthStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    const monthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);

    const statMap = new Map(sorted.map((item) => [String(item.stat_date).slice(0, 10), item]));
    const days: StatDay[] = [];
    for (let day = new Date(monthStart); day <= monthEnd; day.setDate(day.getDate() + 1)) {
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, "0");
      const dd = String(day.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const stat = statMap.get(key);
      days.push({
        stat_date: key,
        page_views: Number(stat?.page_views || 0),
        unique_visitors: Number(stat?.unique_visitors || 0),
        link_clicks: Number(stat?.link_clicks || 0),
      });
    }
    return days;
  }, [stats]);

  const monthRangeMin = monthlyStats[0]?.stat_date || "";
  const monthRangeMax = monthlyStats[monthlyStats.length - 1]?.stat_date || "";
  const effectiveRangeFrom = statRange.from || monthRangeMin;
  const effectiveRangeTo = statRange.to || monthRangeMax;
  const rangeFrom = effectiveRangeFrom <= effectiveRangeTo ? effectiveRangeFrom : effectiveRangeTo;
  const rangeTo = effectiveRangeFrom <= effectiveRangeTo ? effectiveRangeTo : effectiveRangeFrom;

  const filteredMonthlyStats = useMemo(
    () => monthlyStats.filter((item) => item.stat_date >= rangeFrom && item.stat_date <= rangeTo),
    [monthlyStats, rangeFrom, rangeTo],
  );

  const maxBarValue = useMemo(
    () => Math.max(1, ...filteredMonthlyStats.map((item) => Number(item[activeStatMetric] || 0))),
    [activeStatMetric, filteredMonthlyStats],
  );

  const monthlyMetricSummary = useMemo(() => {
    const total = filteredMonthlyStats.reduce((sum, item) => sum + Number(item[activeStatMetric] || 0), 0);
    const average = filteredMonthlyStats.length ? total / filteredMonthlyStats.length : 0;
    let peak = filteredMonthlyStats[0] || null;
    for (const item of filteredMonthlyStats) {
      if (Number(item[activeStatMetric] || 0) > Number(peak?.[activeStatMetric] || 0)) {
        peak = item;
      }
    }
    const hovered = hoveredMonthlyIndex === null ? null : filteredMonthlyStats[hoveredMonthlyIndex] || null;
    return {
      total,
      average,
      peak,
      hovered,
    };
  }, [activeStatMetric, filteredMonthlyStats, hoveredMonthlyIndex]);

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
      setHourly24(MOCK_HOURLY24);
      setPopular(MOCK_POPULAR);
      markSectionLoaded("popular");
      return;
    }

    const statsRes = await fetch("/api/admin/stats", { cache: "no-store" });
    if (!statsRes.ok) throw new Error("加载统计失败");
    const statsData = await readJsonSafe<{
      days?: StatDay[];
      stats?: StatDay[];
      trend7?: Array<{ stat_date: string; link_clicks: number }>;
      popularCategories?: Array<{
        repo: string;
        url?: string;
        sourceUrl?: string;
        clicks: number;
        trend7?: Array<{ stat_date: string; clicks: number }>;
        isValid?: boolean | null;
      }>;
      popularRepos?: Array<{
        repo: string;
        url?: string;
        sourceUrl?: string;
        clicks: number;
        trend7?: Array<{ stat_date: string; clicks: number }>;
        isValid?: boolean | null;
      }>;
      hourly24?: HourStat[];
      hourly?: HourStat[];
    }>(statsRes);

    setStats(statsData?.days || statsData?.stats || []);
    setTrend7(statsData?.trend7 || []);
    setHourly24(statsData?.hourly24 || statsData?.hourly || []);

    const popularSource = statsData?.popularCategories || statsData?.popularRepos || [];
    setPopular(
      popularSource.map((item) => ({
        repo: item.repo,
        url: item.url || item.sourceUrl || "",
        clicks: Number(item.clicks || 0),
        trend7: item.trend7 || [],
        isValid: item.isValid ?? null,
      })),
    );

    markSectionLoaded("popular");
  }, [markSectionLoaded]);

  const loadOverview = useCallback(async () => {
    await loadStats();

    if (MOCK_MODE) {
      setSystem({ uptimeSec: 3600, cpuCores: 8, mem: { usageRate: 42 } });
      markSectionLoaded("overview");
      return;
    }

    const sysRes = await fetch("/api/admin/system", { cache: "no-store" });
    if (!sysRes.ok) throw new Error("加载系统信息失败");
    const sysData = await readJsonSafe<SystemInfo>(sysRes);
    if (sysData) {
      setSystem(sysData);
    }
    markSectionLoaded("overview");
  }, [loadStats, markSectionLoaded]);

  const loadLinks = useCallback(async () => {
    const search = new URLSearchParams({ module: activeLinkModule });
    if (activeLinkModule === "resource_matrix") {
      search.set("resource_sub_module", activeResourceSubModule);
    }
    if (MOCK_MODE && !mockLinksResetDone) {
      search.set("reset", "1");
    }

    const linksRes = await fetch(`/api/admin/links?${search.toString()}`, { cache: "no-store" });
    if (!linksRes.ok) throw new Error("加载链接失败");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
    if (MOCK_MODE && !mockLinksResetDone) {
      setMockLinksResetDone(true);
    }
    try {
      const healthRes = await fetch("/api/admin/link-health", { cache: "no-store" });
      if (healthRes.ok) {
        const healthData = await readJsonSafe<{ health?: LinkHealth[] }>(healthRes);
        setHealth(healthData?.health || []);
      }
    } catch {
      // ignore health fetch failures on links tab
    }
    markSectionLoaded("links");
  }, [activeLinkModule, activeResourceSubModule, markSectionLoaded, mockLinksResetDone]);

  const loadUsers = useCallback(async () => {
    if (MOCK_MODE) {
      setUsers(MOCK_USERS);
      markSectionLoaded("users");
      return;
    }

    const usersRes = await fetch("/api/admin/users", { cache: "no-store" });
    if (!usersRes.ok) throw new Error("加载用户失败");
    const usersData = await readJsonSafe<{ users?: AdminUser[] }>(usersRes);
    setUsers(usersData?.users || []);
    markSectionLoaded("users");
  }, [markSectionLoaded]);

  const loadHealth = useCallback(async () => {
    if (MOCK_MODE) {
      setHealth(MOCK_HEALTH);
      markSectionLoaded("health");
      return;
    }

    const healthRes = await fetch("/api/admin/link-health", { cache: "no-store" });
    if (!healthRes.ok) throw new Error("加载健康检测失败");
    const healthData = await readJsonSafe<{ health?: LinkHealth[] }>(healthRes);
    setHealth(healthData?.health || []);
    markSectionLoaded("health");
  }, [markSectionLoaded]);

  const loadLogs = useCallback(async () => {
    try {
      const logRes = await fetch("/api/admin/logs", { cache: "no-store" });
      if (!logRes.ok) throw new Error("加载日志失败");
      const logData = await readJsonSafe<{ logs?: LinkLog[] }>(logRes);
      setLogs(logData?.logs || []);
      markSectionLoaded("logs");
    } catch {
      if (MOCK_MODE) {
        setLogs([]);
        markSectionLoaded("logs");
        return;
      }
      throw new Error("加载日志失败");
    }
  }, [markSectionLoaded]);

  const loadSectionById = useCallback(async (sectionId: string, role: "super" | "editor") => {
    if (sectionId === "overview" || sectionId === "popular") {
      await loadOverview();
      return;
    }
    if (sectionId === "links") {
      await loadLinks();
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
  }, [loadHealth, loadLinks, loadLogs, loadOverview, loadUsers]);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/admin/me", { cache: "no-store" });
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

    void init();
  }, [loadLinks, loadOverview, router]);

  // 懒加载对应分区数据，并滚动到目标分区
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (!user || loadedSections[sectionId]) return;
    loadSectionById(sectionId, user.role).catch(() => {
      setError("加载模块数据失败");
    });
  };

  const switchLinkModule = async (nextModule: NavModule) => {
    setActiveLinkModule(nextModule);
    const nextSubModule = nextModule === "resource_matrix" ? activeResourceSubModule : "think_tank";
    setLinkForm((prev) => ({
      ...prev,
      module: nextModule,
      resource_sub_module: nextSubModule,
    }));
    try {
      const search = new URLSearchParams({ module: nextModule });
      if (nextModule === "resource_matrix") {
        search.set("resource_sub_module", nextSubModule);
      }
      const linksRes = await fetch(`/api/admin/links?${search.toString()}`);
      if (!linksRes.ok) throw new Error("加载导航模块数据失败");
      const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
      setLinks(linksData?.links || []);
      markSectionLoaded("links");
    } catch {
      setError("加载导航模块数据失败");
    }
  };

  const switchResourceSubModule = async (nextSubModule: ResourceSubModule) => {
    setActiveResourceSubModule(nextSubModule);
    setLinkForm((prev) => ({ ...prev, resource_sub_module: nextSubModule }));
    if (activeLinkModule !== "resource_matrix") return;
    try {
      const search = new URLSearchParams({
        module: "resource_matrix",
        resource_sub_module: nextSubModule,
      });
      const linksRes = await fetch(`/api/admin/links?${search.toString()}`);
      if (!linksRes.ok) throw new Error("加载资源矩阵子模块数据失败");
      const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
      setLinks(linksData?.links || []);
      markSectionLoaded("links");
    } catch {
      setError("加载资源矩阵子模块数据失败");
    }
  };

  const handleSidebarSectionClick = (sectionId: string) => {
    if (sectionId === "links") {
      setLinksNavExpanded((prev) => !prev);
      scrollToSection(sectionId);
      return;
    }
    scrollToSection(sectionId);
  };

  const handleSidebarModuleClick = (module: NavModule) => {
    setLinksNavExpanded(true);
    setActiveSection("links");
    void switchLinkModule(module);
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
    setError("");
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...linkForm,
          module: activeLinkModule,
          resource_sub_module: activeLinkModule === "resource_matrix" ? activeResourceSubModule : undefined,
        }),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "新增链接失败");
      setLinkForm({
        title: "",
        url: "",
        description: "",
        sort: 0,
        module: activeLinkModule,
        resource_sub_module: activeResourceSubModule,
      });
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
        loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "新增链接失败"));
    }
  };

  // 删除链接后刷新相关分区数据
  const removeLink = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/links?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await readJsonSafe<{ error?: string }>(res);
        throw new Error(data?.error || "删除链接失败");
      }
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
        loadedSections.popular ? loadStats().catch(() => {}) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "删除链接失败"));
    }
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
      if (!res.ok) throw new Error(data?.error || "创建用户澶辫触");
      setUserForm({ username: "", password: "", role: "editor" });
      await Promise.all([loadUsers(), loadLogs().catch(() => {})]);
    } catch (err) {
      setError(String((err as Error).message || "创建用户澶辫触"));
    }
  };

  const updateUser = async (targetUser: AdminUser, patch: Partial<Pick<AdminUser, "role">> & { password?: string }) => {
    if (MOCK_MODE) {
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, ...patch } : item)));
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: targetUser.id, ...patch }),
    });
    const data = await readJsonSafe<{ error?: string }>(res);
    if (!res.ok) throw new Error(data?.error || "更新用户失败");
    await Promise.all([loadUsers(), loadLogs().catch(() => {})]);
  };

  const toggleUserRole = async (targetUser: AdminUser) => {
    try {
      await updateUser(targetUser, { role: targetUser.role === "super" ? "editor" : "super" });
    } catch (err) {
      setError(String((err as Error).message || "更新用户失败"));
    }
  };

  const resetUserPassword = async (targetUser: AdminUser) => {
    const password = String(userPasswordDrafts[targetUser.id] || "");
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    try {
      await updateUser(targetUser, { password });
      setUserPasswordDrafts((prev) => ({ ...prev, [targetUser.id]: "" }));
    } catch (err) {
      setError(String((err as Error).message || "重置密码失败"));
    }
  };

  const removeUser = async (targetUser: AdminUser) => {
    if (MOCK_MODE) {
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?id=${targetUser.id}`, { method: "DELETE" });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "删除用户失败");
      await Promise.all([loadUsers(), loadLogs().catch(() => {})]);
    } catch (err) {
      setError(String((err as Error).message || "删除用户失败"));
    }
  };

  const runHealthCheck = async () => {
    if (healthChecking) return;
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
    const timer = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoDetectEnabled || autoDetectIntervalMinutes < 1) return;
    const intervalId = window.setInterval(() => {
      void runHealthCheck();
    }, autoDetectIntervalMinutes * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [autoDetectEnabled, autoDetectIntervalMinutes, healthChecking]);

  useEffect(() => {
    if (activeSection !== "health" && activeSection !== "links") return;
    const intervalId = window.setInterval(() => {
      loadHealth().catch(() => {});
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeSection, loadHealth]);

  const openAutoDetectDialog = () => {
    setAutoDetectDraftMinutes(String(autoDetectIntervalMinutes));
    setAutoDetectDialogOpen(true);
  };

  const saveAutoDetectSettings = () => {
    const nextMinutes = Number(autoDetectDraftMinutes);
    if (!Number.isFinite(nextMinutes) || nextMinutes < 1) {
      setError("自动检测时间必须大于等于 1 分钟");
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
          {/* 侧边导航：支持模块快速切换 */}
          {sections.map((section) => (
            <div
              key={section.id}
              className={`admin-console-nav-group ${section.id === "links" && linksNavExpanded ? "is-expanded" : ""}`}
            >
              <button
                type="button"
                className={`admin-console-side-item admin-console-side-item--primary ${activeSection === section.id ? "active" : ""}`}
                onClick={() => handleSidebarSectionClick(section.id)}
                aria-expanded={section.id === "links" ? linksNavExpanded : undefined}
              >
                <span>{section.label}</span>
                {section.id === "links" ? (
                  <span className="admin-console-side-chevron">{linksNavExpanded ? "▾" : "▸"}</span>
                ) : null}
              </button>
              {section.id === "links" ? (
                <div
                  className={`admin-console-subnav ${linksNavExpanded ? "is-expanded" : "is-collapsed"}`}
                  aria-hidden={!linksNavExpanded}
                >
                  {(Object.keys(NAV_MODULE_META) as NavModule[]).map((moduleKey) => (
                    <button
                      key={moduleKey}
                      type="button"
                      className={`admin-console-side-item admin-console-subnav-item ${activeSection === "links" && activeLinkModule === moduleKey ? "active" : ""}`}
                      onClick={() => handleSidebarModuleClick(moduleKey)}
                    >
                      {NAV_MODULE_META[moduleKey].label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </aside>

        <div className="admin-console-content">
      {/* 顶部信息卡：当前登录用户与快捷操作 */}
      <div id="overview" className="admin-card admin-console-anchor-card" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "rgba(226,238,252,0.94)", borderColor: "#93C5FD", boxShadow: "0 14px 34px rgba(37,99,235,0.18)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>管理后台</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            当前用户：{user.username}（{user.role === "super" ? "超级管理员" : "编辑"}）
          </div>
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
      {/* 按当前激活分区显示对应内容 */}
      {activeSection === "overview" ? (
        <div className="admin-section-transition">
          <div className="admin-card admin-console-pagehead admin-overview-panel" style={{ padding: 16 }}>
            <div className="admin-console-title-row">
              <span className="admin-console-icon-badge admin-console-icon-badge-soft">
                <LayoutDashboard size={16} />
              </span>
              <div className="admin-console-pagehead-title">首页总览</div>
            </div>
            <div className="admin-console-pagehead-desc">查看系统运行状态、今日访问数据和后台全局摘要。</div>
          </div>
          <div className="admin-card admin-overview-panel" style={{ padding: 16, background: "linear-gradient(135deg,#FFFFFF 0%,#F3F8FF 55%,#EEF6FF 100%)", border: "1px solid #DCE8F8", boxShadow: "0 14px 28px rgba(37,99,235,0.08)" }}>
            <div className="admin-console-title-row" style={{ marginBottom: 10 }}>
              <span className="admin-console-icon-badge" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.22))", color: "#1D4ED8" }}>
                <ServerCog size={16} />
              </span>
              <div style={{ fontWeight: 700, color: "#0F172A" }}>服务器运行情况</div>
            </div>
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
                  <span>服务状态实时更新</span>
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
              { label: "今日访问量 (PV)", value: today.page_views, icon: Eye, tint: "linear-gradient(135deg, rgba(14,165,233,0.16), rgba(14,165,233,0.26))", color: "#0EA5E9" },
              { label: "今日访客数 (UV)", value: today.unique_visitors, icon: Users, tint: "linear-gradient(135deg, rgba(5,150,105,0.16), rgba(16,185,129,0.24))", color: "#059669" },
              { label: "今日点击量", value: today.link_clicks, icon: MousePointerClick, tint: "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.26))", color: "#1D4ED8" },
            ].map((item) => (
              <div key={item.label} className="admin-card admin-console-kpi-card admin-overview-panel" style={{ padding: 12, background: "rgba(214,231,250,0.95)", borderColor: "#93C5FD", boxShadow: "0 10px 26px rgba(37,99,235,0.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{item.label}</div>
                  <span className="admin-console-icon-badge" style={{ background: item.tint, color: item.color }}>
                    <item.icon size={14} />
                  </span>
                </div>
                <div style={{ fontSize: 26, color: "#1D4ED8", fontWeight: 800 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="admin-card admin-console-chart-card admin-console-anchor-card admin-overview-panel" style={{ padding: 12 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div className="admin-console-title-row" style={{ marginBottom: 4 }}>
                    <span className="admin-console-icon-badge" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(59,130,246,0.24))", color: "#2563EB" }}>
                      <Activity size={15} />
                    </span>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>今日概况（24 小时）</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                    按小时展示访问量、访客数与点击量的变化趋势。
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hourlyLineChart.metricKeys.map((metricKey) => (
                    <span
                      key={`legend-${metricKey}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        borderRadius: 999,
                        border: `1px solid ${STAT_METRIC_META[metricKey].color}33`,
                        background: "#FFFFFF",
                        fontSize: 12,
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: STAT_METRIC_META[metricKey].color }} />
                      {STAT_METRIC_META[metricKey].label}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #BFDBFE",
                  borderRadius: 12,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(239,246,255,0.72))",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>
                  {hourlyOverview.hovered ? `${String(hourlyOverview.hovered.hour).padStart(2, "0")}:00 - ${String(hourlyOverview.hovered.hour).padStart(2, "0")}:59` : "今日累计"}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {(Object.keys(STAT_METRIC_META) as StatMetricKey[]).map((metricKey) => (
                    <span key={`hourly-overview-${metricKey}`} style={{ fontSize: 12, color: STAT_METRIC_META[metricKey].color, fontWeight: 700 }}>
                      {STAT_METRIC_META[metricKey].label}：{hourlyOverview.hovered ? Number(hourlyOverview.hovered[metricKey] || 0) : Number(hourlyOverview.totals[metricKey] || 0)}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="admin-console-chart-surface"
                style={{
                  minHeight: 300,
                  border: "1px dashed #93C5FD",
                  borderRadius: 14,
                  padding: 12,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(239,246,255,0.82))",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <svg
                  viewBox={`0 0 ${hourlyLineChart.width} ${hourlyLineChart.height}`}
                  style={{ width: "100%", height: "100%", display: "block" }}
                  aria-label="今日24小时访问与点击趋势"
                >
                  {hourlyLineChart.yTicks.map((tick) => (
                    <g key={`hourly-y-${tick.y}`}>
                      <line x1={hourlyLineChart.padding.left} y1={tick.y} x2={hourlyLineChart.width - hourlyLineChart.padding.right} y2={tick.y} stroke="rgba(148,163,184,0.24)" strokeDasharray="4 4" />
                      <text x={8} y={tick.y + 4} fontSize="11" fill="#64748B">
                        {tick.value}
                      </text>
                    </g>
                  ))}

                  {hourlyLineChart.xTicks.map((hour) => {
                    const x = hourlyLineChart.pointsByMetric.page_views[hour]?.x || hourlyLineChart.padding.left;
                    return (
                      <g key={`hourly-x-${hour}`}>
                        <line x1={x} y1={hourlyLineChart.padding.top} x2={x} y2={hourlyLineChart.height - hourlyLineChart.padding.bottom} stroke="rgba(148,163,184,0.1)" />
                        <text x={x} y={hourlyLineChart.height - 6} textAnchor="middle" fontSize="10" fill="#64748B">
                          {String(hour).padStart(2, "0")}
                        </text>
                      </g>
                    );
                  })}

                  {hourlyLineChart.metricKeys.map((metricKey) => (
                    <g key={`hourly-path-${metricKey}`}>
                      <path
                        d={hourlyLineChart.linePathByMetric[metricKey]}
                        fill="none"
                        stroke={STAT_METRIC_META[metricKey].color}
                        strokeWidth={metricKey === "page_views" ? 2.6 : 2.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {hourlyLineChart.pointsByMetric[metricKey].map((point, index) => {
                        const isActive = index === hoveredHourlyIndex;
                        return (
                          <circle
                            key={`hourly-point-${metricKey}-${point.hour}`}
                            cx={point.x}
                            cy={point.y}
                            r={isActive ? 4.1 : 2.5}
                            fill="#FFFFFF"
                            stroke={STAT_METRIC_META[metricKey].color}
                            strokeWidth={isActive ? 2.2 : 1.6}
                            style={{ transition: "r 0.16s ease, stroke-width 0.16s ease" }}
                          />
                        );
                      })}
                    </g>
                  ))}
                </svg>

                <div
                  style={{
                    position: "absolute",
                    inset: `${hourlyLineChart.padding.top}px ${hourlyLineChart.padding.right}px ${hourlyLineChart.padding.bottom}px ${hourlyLineChart.padding.left}px`,
                    display: "grid",
                    gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
                  }}
                >
                  {hourlyStats.map((item, index) => (
                    <button
                      key={`hourly-hit-${item.hour}`}
                      type="button"
                      onMouseEnter={() => setHoveredHourlyIndex(index)}
                      onMouseLeave={() => setHoveredHourlyIndex(null)}
                      onFocus={() => setHoveredHourlyIndex(index)}
                      onBlur={() => setHoveredHourlyIndex(null)}
                      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                      aria-label={String(item.hour).padStart(2, "0") + "点数据"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="admin-card admin-console-chart-card admin-console-anchor-card admin-overview-panel" style={{ padding: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.6fr)",
                gap: 12,
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  border: "1px solid #DCE8F8",
                  borderRadius: 14,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,255,0.92))",
                  padding: 14,
                  display: "grid",
                  gap: 12,
                }}
              >
                <div>
                  <div className="admin-console-title-row" style={{ marginBottom: 4 }}>
                    <span className="admin-console-icon-badge" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(99,102,241,0.24))", color: "#1D4ED8" }}>
                      <BarChart3 size={15} />
                    </span>
                    <div style={{ fontWeight: 800, color: "#0F172A" }}>月度数据柱形图</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>切换指标与日期区间，图表会即时响应。</div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(Object.keys(STAT_METRIC_META) as StatMetricKey[]).map((metricKey) => {
                    const isActive = metricKey === activeStatMetric;
                    return (
                      <button
                        key={metricKey}
                        type="button"
                        onClick={() => setActiveStatMetric(metricKey)}
                        className={isActive ? "admin-btn" : "admin-btn-ghost"}
                        style={isActive
                          ? {
                              background: STAT_METRIC_META[metricKey].color,
                              borderColor: STAT_METRIC_META[metricKey].color,
                              color: "#fff",
                            }
                          : undefined}
                      >
                        {STAT_METRIC_META[metricKey].label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>日期区间</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{monthRangeMin ? monthRangeMin.slice(0, 7) : ""}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
                    <input
                      type="date"
                      className="admin-input"
                      value={effectiveRangeFrom}
                      min={monthRangeMin}
                      max={monthRangeMax}
                      onChange={(e) => setStatRange((prev) => ({ ...prev, from: e.target.value }))}
                    />
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>至</span>
                    <input
                      type="date"
                      className="admin-input"
                      value={effectiveRangeTo}
                      min={monthRangeMin}
                      max={monthRangeMax}
                      onChange={(e) => setStatRange((prev) => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                  <div className="admin-overview-submetric" style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 10, background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                      <BarChart3 size={12} />
                      总计
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{Math.round(monthlyMetricSummary.total)}</div>
                  </div>
                  <div className="admin-overview-submetric" style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 10, background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                      <Clock3 size={12} />
                      日均
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{Math.round(monthlyMetricSummary.average)}</div>
                  </div>
                  <div className="admin-overview-submetric" style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 10, background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                      <Activity size={12} />
                      峰值
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                      {Number(monthlyMetricSummary.peak?.[activeStatMetric] || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="admin-console-chart-surface"
                style={{
                  minHeight: 320,
                  border: "1px dashed #93C5FD",
                  borderRadius: 14,
                  padding: 14,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.74), rgba(239,246,255,0.82))",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                {filteredMonthlyStats.length ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
                        当前指标：{STAT_METRIC_META[activeStatMetric].label}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        {rangeFrom || "-"} 至 {rangeTo || "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        minHeight: 42,
                        border: "1px solid #BFDBFE",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.92)",
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        pointerEvents: "none",
                      }}
                    >
                      {monthlyMetricSummary.hovered ? (
                        <>
                          <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>
                            {monthlyMetricSummary.hovered.stat_date}
                          </span>
                          <span style={{ fontSize: 12, color: STAT_METRIC_META[activeStatMetric].color, fontWeight: 800 }}>
                            {STAT_METRIC_META[activeStatMetric].label}：{Number(monthlyMetricSummary.hovered[activeStatMetric] || 0)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          悬停柱状条可查看每日 {STAT_METRIC_META[activeStatMetric].label}。
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 7,
                        minHeight: 220,
                        overflowX: "auto",
                        paddingBottom: 22,
                        paddingTop: 6,
                        paddingLeft: 4,
                        paddingRight: 4,
                      }}
                    >
                      {filteredMonthlyStats.map((item, index) => {
                        const value = Number(item[activeStatMetric] || 0);
                        const barHeight = Math.max(12, Math.round((value / maxBarValue) * 180));
                        const isActive = hoveredMonthlyIndex === index;
                        return (
                          <button
                            key={item.stat_date}
                            type="button"
                            onMouseEnter={() => setHoveredMonthlyIndex(index)}
                            onMouseLeave={() => setHoveredMonthlyIndex(null)}
                            onFocus={() => setHoveredMonthlyIndex(index)}
                            onBlur={() => setHoveredMonthlyIndex(null)}
                            style={{
                              minWidth: 24,
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              display: "grid",
                              gap: 6,
                              justifyItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: 10, color: "#64748B", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", opacity: isActive ? 1 : 0.85 }}>
                              {value}
                            </div>
                            <div
                              title={item.stat_date + " " + STAT_METRIC_META[activeStatMetric].label + "：" + value}
                              style={{
                                width: 18,
                                height: barHeight,
                                borderRadius: "8px 8px 3px 3px",
                                border: "1px solid " + STAT_METRIC_META[activeStatMetric].color + "55",
                                background: "linear-gradient(180deg, " + STAT_METRIC_META[activeStatMetric].bg + ", " + STAT_METRIC_META[activeStatMetric].color + ")",
                                transform: isActive ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                                boxShadow: isActive ? "0 10px 22px rgba(37,99,235,0.18)" : "none",
                                transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
                                filter: isActive ? "saturate(1.1)" : "saturate(0.98)",
                              }}
                            />
                            <div
                              style={{
                                fontSize: 10,
                                color: isActive ? "#0F172A" : "#64748B",
                                transform: "rotate(-25deg)",
                                transformOrigin: "center top",
                                whiteSpace: "nowrap",
                                fontWeight: isActive ? 700 : 500,
                              }}
                            >
                              {String(item.stat_date).slice(5)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>所选区间暂无数据，请调整日期范围。</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {activeSection === "popular" ? (
      <div className="admin-section-transition">
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">热门仓库</div>
        <div className="admin-console-pagehead-desc">聚合查看近 7 天点击走势与链接热度表现。</div>
      </div>
      <div id="popular" className="admin-card admin-console-chart-card admin-console-anchor-card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>近 7 天点击走势</div>
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
                left: ((lineChart.points[hoveredTrendIndex].x / lineChart.width) * 100) + "%",
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
                点击量：{lineChart.points[hoveredTrendIndex].link_clicks}
              </div>
            </div>
          ) : null}
          <svg
            viewBox={"0 0 " + lineChart.width + " " + lineChart.height}
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
        <div style={{ fontWeight: 700, margin: "12px 0 8px" }}>热门链接（点击量）</div>
        <div className="admin-console-chart-surface" style={{ minHeight: 140, border: "1px dashed #93C5FD", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.5)" }}>
          <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFD" }}>
                  <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>链接名</th>
                  <th style={{ textAlign: "right", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>近 7 天总点击量</th>
                  <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>近 7 天点击趋势图</th>
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
                        {p.isValid === true ? "有效" : p.isValid === false ? "异常" : "待检测"}
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
      </div>
      ) : null}


            {activeSection === "links" ? (
      <div className="admin-section-transition">
      <div className="admin-card admin-console-pagehead" style={{ padding: 16 }}>
        <div className="admin-console-pagehead-title">内容管理</div>
        <div className="admin-console-pagehead-desc">按模块管理资源矩阵、友情链接、小游戏；资源矩阵下支持智库、校园、工具三个子模块。</div>
      </div>
      <div id="links" className="admin-card" style={{ padding: 16, display: "grid", gap: 12 }}>
        {activeLinkModule === "resource_matrix" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(RESOURCE_SUB_MODULE_META) as ResourceSubModule[]).map((subKey) => {
              const isActive = subKey === activeResourceSubModule;
              return (
                <button
                  key={subKey}
                  type="button"
                  className={isActive ? "admin-btn" : "admin-btn-ghost"}
                  onClick={() => {
                    void switchResourceSubModule(subKey);
                  }}
                >
                  {RESOURCE_SUB_MODULE_META[subKey].label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 8 }}>
          <form
            onSubmit={submitLink}
            className="admin-link-create-form"
            style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1.2fr 1fr 120px 160px" }}
          >
            <input className="admin-input" placeholder="标题" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
            <input className="admin-input" placeholder="URL" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
            <input className="admin-input" placeholder="描述" value={linkForm.description} onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })} />
            <input className="admin-input" type="number" placeholder="排序" value={linkForm.sort} onChange={(e) => setLinkForm({ ...linkForm, sort: Number(e.target.value || 0) })} />
            <button type="submit" className="admin-btn admin-link-create-form__submit">点击添加到当前模块</button>
          </form>
        </div>

        <div style={{ fontSize: 12, color: "#64748B" }}>
          当前模块：{NAV_MODULE_META[activeLinkModule].label}
          {activeLinkModule === "resource_matrix" ? ` / ${RESOURCE_SUB_MODULE_META[activeResourceSubModule].label}` : ""}
        </div>

        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFD" }}>
                {["ID", "标题", "URL", "点击次数", "创建时间", "健康状态", "操作"].map((h) => (
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
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", fontVariantNumeric: "tabular-nums" }}>{Number(item.click_count || 0)}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>
                    {item.created_at ? String(item.created_at).replace("T", " ").slice(0, 19) : "-"}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", fontWeight: 600 }}>
                    {(() => {
                      const h = healthMapByLinkId.get(item.id);
                      if (!h) return <span style={{ color: "#64748B" }}>未检测</span>;
                      if (h.is_ok) return <span style={{ color: "#059669" }}>有效</span>;
                      return <span style={{ color: "#DC2626" }}>异常</span>;
                    })()}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => removeLink(item.id)} className="admin-btn-ghost" style={{ color: "#B91C1C", borderColor: "#FCA5A5" }}>删除</button>
                  </td>
                </tr>
              ))}
              {!links.length ? (
                <tr><td colSpan={7} style={{ padding: "14px", color: "#64748B" }}>当前筛选下暂无内容</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      ) : null}

      {activeSection === "health" ? (
      <div className="admin-section-transition">
      <div className="admin-card admin-console-pagehead" style={{ padding: 18, border: "1px solid #E6ECF5", background: "linear-gradient(180deg,#FFFFFF 0%,#F8FBFF 100%)" }}>
        <div className="admin-console-pagehead-title">链接健康检测</div>
        <div className="admin-console-pagehead-desc">监控链接可用性、异常比例与最近探测结果。</div>
      </div>
      <div id="health" className="admin-card" style={{ padding: 20, background: "#F3F6FA", border: "1px solid #E6ECF5", borderRadius: 12, display: "grid", gap: 16, boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14, boxShadow: "inset 0 0 0 1px rgba(24,144,255,0.06)" }}>
            <div style={{ fontSize: 12, color: "#64748B", letterSpacing: 0.2 }}>健康度评估</div>
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
                ? `自动检测已开启：每 ${autoDetectIntervalMinutes} 分钟执行一次${lastAutoDetectAt ? `，最近一次 ${lastAutoDetectAt.replace("T", " ").slice(0, 19)}` : ""}`
                : "自动检测未开启"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={openAutoDetectDialog}
              className="admin-btn-ghost"
              style={{ height: 34, padding: "0 14px", borderRadius: 8, borderColor: autoDetectEnabled ? "#86EFAC" : "#CBD5E1", color: autoDetectEnabled ? "#166534" : "#334155" }}
            >
              自动检测
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
                      {h.is_ok ? "运行正常" : "服务不可用"}
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
      </div>
      ) : null}

      {activeSection === "logs" ? (
      <div className="admin-section-transition">
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
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>对象/详情</th>
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
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#64748B", maxWidth: 360, wordBreak: "break-all", lineHeight: 1.5 }}>
                    {formatLogObjectAndDetail(l)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      ) : null}

      {user.role === "super" && activeSection === "users" ? (
      <div className="admin-section-transition">
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
                {["ID", "Username", "Role", "Created At", "Last Login", "操作"].map((h) => (
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
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8, alignItems: "center", minWidth: 360 }}>
                    <button type="button" onClick={() => toggleUserRole(u)} className="admin-btn-ghost">{u.role === "super" ? "降为 editor" : "升为 super"}</button>
                    <input
                      className="admin-input"
                      type="password"
                      placeholder="新密码"
                      value={userPasswordDrafts[u.id] || ""}
                      onChange={(e) => setUserPasswordDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      style={{ width: 110 }}
                    />
                    <button type="button" onClick={() => resetUserPassword(u)} className="admin-btn-ghost">改密</button>
                    <button type="button" onClick={() => removeUser(u)} className="admin-btn-ghost" style={{ color: "#B91C1C", borderColor: "#FCA5A5" }}>删除</button>
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr><td colSpan={6} style={{ padding: "14px", color: "#64748B" }}>暂无用户数据</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </div>
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
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>自动检测设置</div>
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

function formatLogObjectAndDetail(log: LinkLog): string {
  const target = log.link_id ? `${log.link_title ? `${log.link_title} ` : ""}(#${log.link_id})` : "-";
  const detail = "detail" in log ? formatLogDetail(log.detail) : "-";
  if (target === "-" && detail === "-") return "-";
  if (target === "-") return detail;
  if (detail === "-") return target;
  return `${target} | ${detail}`;
}




