"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, BarChart3, Clock3, Database, Eye, Gauge, LayoutDashboard, ListChecks, MousePointerClick, Radio, ServerCog, ShieldCheck, TrendingUp, Users } from "lucide-react";
import PortalTooltip from "@/components/shared/PortalTooltip";
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
type TopClick = {
  link_id?: number | null;
  title: string;
  url?: string | null;
  module?: NavModule | string;
  resource_sub_module?: ResourceSubModule | null;
  clicks: number;
};
type StatMetricKey = "link_clicks" | "page_views" | "unique_visitors";
type StatsSource = {
  type?: string;
  today?: string;
  hourly24?: string;
  topClicks?: string;
  days?: string;
  sampledAt?: string;
};
type SystemInfo = {
  uptimeSec: number;
  cpuCores: number;
  status?: string;
  sampledAt?: string;
  mem: {
    usageRate: number | null;
    processAllocBytes?: number | null;
    processSysBytes?: number | null;
    usedBytes?: number | null;
    totalBytes?: number | null;
    availableBytes?: number | null;
    source?: string;
    systemAvailable?: boolean;
  };
  network?: {
    rxBytes: number | null;
    txBytes: number | null;
    totalBytes: number | null;
    sampledAt: string;
    available?: boolean;
    source?: string;
  };
  services?: {
    backend?: ServiceProbe;
    database?: ServiceProbe;
    redis?: ServiceProbe;
  };
};

type ServiceProbe = {
  ok?: boolean;
  status?: string;
  message?: string;
  latencyMs?: number | null;
  checkedAt?: string;
};

type LinkHealth = {
  id?: number;
  link_id: number;
  title: string;
  url?: string;
  status_code: number | null;
  is_ok: boolean | number;
  message?: string | null;
  checked_at: string;
  module?: NavModule;
  resource_sub_module?: ResourceSubModule | null;
};

type HealthProgress = {
  checked: number;
  total: number;
  failed: number;
  skipped?: number;
  current_title?: string;
  current_url?: string;
} | null;

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
  { id: "health", label: "健康检测" },
  { id: "logs", label: "操作日志" },
] as const;

const ERROR_AUTO_DISMISS_MS = 4000;

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function parseDetailObject(detail: unknown): Record<string, unknown> | null {
  if (!detail) return null;
  if (typeof detail === "object" && !Array.isArray(detail)) {
    return detail as Record<string, unknown>;
  }
  if (typeof detail === "string") {
    const text = detail.trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { text };
    }
  }
  return null;
}

function moduleLabel(moduleValue: unknown, subModuleValue?: unknown): string {
  const moduleKey = String(moduleValue || "");
  if (moduleKey === "resource_matrix") {
    const subKey = String(subModuleValue || "");
    if (subKey === "campus") return "资源矩阵/校园";
    if (subKey === "tools") return "资源矩阵/工具";
    return "资源矩阵/智库";
  }
  if (moduleKey === "mini_games") return "小游戏";
  if (moduleKey === "friend_links") return "友情链接";
  return "未分类";
}

function isHealthOk(item: LinkHealth): boolean {
  return item.is_ok === true || item.is_ok === 1;
}

function formatHealthCheckedAt(value?: string | null): string {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function healthStatusText(item: LinkHealth): string {
  if (isHealthOk(item)) return "运行正常";
  if (item.status_code) return `HTTP ${item.status_code}`;
  return "连接失败";
}

function toHumanDetail(log: LinkLog): string {
  const detail = parseDetailObject(log.detail);
  if (!detail) return "-";
  const action = String(log.action || "").toLowerCase();

  if (action.includes("health")) {
    const checked = Number(detail.checked || 0);
    const failed = Number(detail.failed || 0);
    const reason = String(detail.reason || "");
    const reasonText = reason === "manual_probe" ? "手动触发" : reason === "realtime_poll" ? "轮询触发" : "";
    return `健康检测：共检测 ${checked} 项，异常 ${failed} 项${reasonText ? `（${reasonText}）` : ""}`;
  }

  if (action.includes("create_link")) {
    const input = parseDetailObject(detail.input);
    const title = String(input?.title || "");
    const url = String(input?.url || "");
    const moduleText = moduleLabel(input?.module, input?.resource_sub_module);
    return `新增链接：${title || "未命名"}（${moduleText}）${url ? `，地址：${url}` : ""}`;
  }

  if (action.includes("update_link") || action.includes("disable_link") || action.includes("enable_link")) {
    const changedFields = Array.isArray(detail.changed_fields)
      ? detail.changed_fields.map((x) => String(x)).filter(Boolean)
      : [];
    const request = parseDetailObject(detail.request);
    const moduleText = request
      ? moduleLabel(request.module, request.resource_sub_module)
      : "";
    const modulePart = moduleText ? `，模块：${moduleText}` : "";
    const changedPart = changedFields.length ? `，变更字段：${changedFields.join("、")}` : "";
    const titlePart = request?.title ? `，标题：${String(request.title)}` : "";
    return `更新链接${modulePart}${titlePart}${changedPart}`.replace(/^更新链接，/, "更新链接：");
  }

  if (action.includes("delete_link")) {
    const before = parseDetailObject(detail.before);
    const title = String(before?.title || "");
    const moduleText = moduleLabel(before?.module, before?.resource_sub_module);
    return `删除链接：${title || "未命名"}（${moduleText}）`;
  }

  if (action.includes("user")) {
    const changedFields = Array.isArray(detail.changed_fields)
      ? detail.changed_fields.map((x) => String(x)).filter(Boolean)
      : [];
    const hasPassword = Boolean(detail.request_password_masked);
    if (hasPassword) return "用户操作：重置密码";
    if (changedFields.includes("role")) return "用户操作：调整角色";
    if (changedFields.length) return `用户操作：修改字段 ${changedFields.join("、")}`;
    return "用户操作";
  }

  if (detail.text) return String(detail.text);
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
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

function formatDurationFromSec(totalSec: number): string {
  const safe = Math.max(0, Math.floor(Number(totalSec || 0)));
  if (safe <= 0) return "<1秒";
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (days > 0) {
    return `${days}天 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const fixed = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(fixed)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function isServiceOnline(service?: ServiceProbe | null): boolean {
  return Boolean(service?.ok) || service?.status === "ok";
}

function serviceValue(service?: ServiceProbe | null): string {
  if (!service) return "等待采样";
  return isServiceOnline(service) ? "在线" : "异常";
}

function serviceMeta(service?: ServiceProbe | null): string {
  if (!service) return "等待实时采样";
  if (isServiceOnline(service)) {
    const latency = typeof service.latencyMs === "number" && Number.isFinite(service.latencyMs)
      ? `${service.latencyMs} ms`
      : "";
    return latency ? `探活 ${latency}` : "探活通过";
  }
  return service.message || service.status || "探活失败";
}

function withSystemFallback(input: SystemInfo | null | undefined): SystemInfo {
  const source = input || ({} as SystemInfo);
  const uptimeSec = Number(source.uptimeSec || 0);
  const cpuCores = Number(source.cpuCores || 0);
  const rawMemUsage = source.mem?.usageRate;
  const memUsage = rawMemUsage === null || rawMemUsage === undefined ? null : Number(rawMemUsage);
  const mem = {
    usageRate: memUsage !== null && Number.isFinite(memUsage) ? memUsage : null,
    processAllocBytes: source.mem?.processAllocBytes ?? null,
    processSysBytes: source.mem?.processSysBytes ?? null,
    usedBytes: source.mem?.usedBytes ?? null,
    totalBytes: source.mem?.totalBytes ?? null,
    availableBytes: source.mem?.availableBytes ?? null,
    source: source.mem?.source || "unavailable",
    systemAvailable: Boolean(source.mem?.systemAvailable),
  };
  const totalBytesRaw = source.network?.totalBytes;
  const hasRealNetwork = totalBytesRaw !== null && totalBytesRaw !== undefined && Number.isFinite(Number(totalBytesRaw));
  const network: NonNullable<SystemInfo["network"]> = hasRealNetwork
    ? {
        rxBytes: source.network?.rxBytes === undefined ? null : source.network.rxBytes,
        txBytes: source.network?.txBytes === undefined ? null : source.network.txBytes,
        totalBytes: Number(totalBytesRaw),
        sampledAt: source.network?.sampledAt || new Date().toISOString(),
        available: true,
        source: source.network?.source || "system",
      }
    : {
        rxBytes: null,
        txBytes: null,
        totalBytes: null,
        sampledAt: source.network?.sampledAt || new Date().toISOString(),
        available: false,
        source: source.network?.source || "unavailable",
      };
  return {
    uptimeSec,
    cpuCores,
    status: source.status || "unknown",
    sampledAt: source.sampledAt || network.sampledAt,
    mem,
    network,
    services: source.services || {},
  };
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
  const [systemStreamState, setSystemStreamState] = useState<"connecting" | "live" | "fallback">("connecting");
  const [health, setHealth] = useState<LinkHealth[]>([]);
  const [logs, setLogs] = useState<LinkLog[]>([]);
  const [hourly24, setHourly24] = useState<HourStat[]>([]);
  const [todayStat, setTodayStat] = useState<StatDay | null>(null);
  const [topClicks, setTopClicks] = useState<TopClick[]>([]);
  const [statsSource, setStatsSource] = useState<StatsSource | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [loadedSections, setLoadedSections] = useState<Record<string, boolean>>({});
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthProgress, setHealthProgress] = useState<HealthProgress>(null);
  const [checkingLinkId, setCheckingLinkId] = useState<number | null>(null);
  const [autoDetectDialogOpen, setAutoDetectDialogOpen] = useState(false);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false);
  const [autoDetectIntervalMinutes, setAutoDetectIntervalMinutes] = useState(15);
  const [autoDetectDraftMinutes, setAutoDetectDraftMinutes] = useState("15");
  const [lastAutoDetectAt, setLastAutoDetectAt] = useState<string | null>(null);
  const [activeLinkModule, setActiveLinkModule] = useState<NavModule>("resource_matrix");
  const [activeResourceSubModule, setActiveResourceSubModule] = useState<ResourceSubModule>("think_tank");
  const [linksNavExpanded, setLinksNavExpanded] = useState(false);
  const [focusedLinkId, setFocusedLinkId] = useState<number | null>(null);
  const [activeStatMetric, setActiveStatMetric] = useState<StatMetricKey>("link_clicks");
  const [statRange, setStatRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [hoveredMonthlyIndex, setHoveredMonthlyIndex] = useState<number | null>(null);
  const [hoveredHourlyIndex, setHoveredHourlyIndex] = useState<number | null>(null);
  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    description: "",
    sort: 0,
    module: "resource_matrix" as NavModule,
    resource_sub_module: "think_tank" as ResourceSubModule,
  });
  const [editLinkId, setEditLinkId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
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
  const [userPasswordDrafts, setUserPasswordDrafts] = useState<Record<number, string>>({});
  const AUTO_DETECT_ENABLED_KEY = "kcos_admin_auto_detect_enabled";
  const AUTO_DETECT_INTERVAL_KEY = "kcos_admin_auto_detect_interval_minutes";
  const AUTO_DETECT_LAST_RUN_KEY = "kcos_admin_auto_detect_last_run_at";

  // 今日 KPI（无数据时使用零值占位）
  const today = useMemo(
    () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      return todayStat || stats.find((item) => String(item.stat_date).slice(0, 10) === todayKey) || stats[stats.length - 1] || {
        stat_date: new Date().toISOString().slice(0, 10),
        page_views: 0,
        unique_visitors: 0,
        link_clicks: 0,
      };
    },
    [stats, todayStat],
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

  const hasHourlyDetail = useMemo(
    () => hourlyOverview.totals.page_views > 0 || hourlyOverview.totals.unique_visitors > 0 || hourlyOverview.totals.link_clicks > 0,
    [hourlyOverview],
  );
  const hasDailyActivity = today.page_views > 0 || today.unique_visitors > 0 || today.link_clicks > 0;
  const hourlyDataNote = hasDailyActivity && !hasHourlyDetail
    ? "日统计已更新，小时明细暂无事件采样"
    : "日统计与小时明细来自同一统计接口";
  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

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
      const timer = window.setTimeout(() => setActiveSection("overview"), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
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

  const failedHealth = useMemo(() => health.filter((item) => !isHealthOk(item)), [health]);
  const latestHealthCheckedAt = useMemo(() => {
    const timestamps = health
      .map((item) => Date.parse(String(item.checked_at || "")))
      .filter((value) => Number.isFinite(value));
    if (!timestamps.length) return "-";
    return formatHealthCheckedAt(new Date(Math.max(...timestamps)).toISOString());
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

  const markSectionLoaded = useCallback((sectionId: string) => {
    setLoadedSections((prev) => (prev[sectionId] ? prev : { ...prev, [sectionId]: true }));
  }, []);
  const loadStats = useCallback(async () => {
    const statsRes = await fetch("/api/admin/stats", { cache: "no-store" });
    if (!statsRes.ok) throw new Error("加载统计失败");
    const statsData = await readJsonSafe<{
      days?: StatDay[];
      stats?: StatDay[];
      today?: StatDay;
      hourly24?: HourStat[];
      hourly?: HourStat[];
      topClicks?: TopClick[];
      top_clicks?: TopClick[];
      source?: StatsSource;
    }>(statsRes);

    setStats(statsData?.days || statsData?.stats || []);
    setTodayStat(statsData?.today || null);
    setHourly24(statsData?.hourly24 || statsData?.hourly || []);
    setTopClicks(statsData?.topClicks || statsData?.top_clicks || []);
    setStatsSource(statsData?.source || null);
  }, []);

  const loadSystem = useCallback(async () => {
    const sysRes = await fetch("/api/admin/system", { cache: "no-store" });
    if (!sysRes.ok) throw new Error("加载系统信息失败");
    const sysData = await readJsonSafe<SystemInfo>(sysRes);
    setSystem(withSystemFallback(sysData));
  }, []);

  const loadOverview = useCallback(async () => {
    await loadStats();
    await loadSystem();
    markSectionLoaded("overview");
  }, [loadStats, loadSystem, markSectionLoaded]);

  const loadLinks = useCallback(async () => {
    const search = new URLSearchParams({ module: activeLinkModule });
    if (activeLinkModule === "resource_matrix") {
      search.set("resource_sub_module", activeResourceSubModule);
    }

    const linksRes = await fetch(`/api/admin/links?${search.toString()}`, { cache: "no-store" });
    if (!linksRes.ok) throw new Error("加载链接失败");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
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
  }, [activeLinkModule, activeResourceSubModule, markSectionLoaded]);

  const loadUsers = useCallback(async () => {
    const usersRes = await fetch("/api/admin/users", { cache: "no-store" });
    if (!usersRes.ok) throw new Error("加载用户失败");
    const usersData = await readJsonSafe<{ users?: AdminUser[] }>(usersRes);
    setUsers(usersData?.users || []);
    markSectionLoaded("users");
  }, [markSectionLoaded]);

  const loadHealth = useCallback(async () => {
    const healthRes = await fetch("/api/admin/link-health", { cache: "no-store" });
    if (!healthRes.ok) throw new Error("加载健康检测失败");
    const healthData = await readJsonSafe<{ health?: LinkHealth[] }>(healthRes);
    setHealth(healthData?.health || []);
    markSectionLoaded("health");
  }, [markSectionLoaded]);

  const fetchLinksForScope = useCallback(async (
    module: NavModule,
    resourceSubModule?: ResourceSubModule,
  ) => {
    const search = new URLSearchParams({ module });
    if (module === "resource_matrix" && resourceSubModule) {
      search.set("resource_sub_module", resourceSubModule);
    }
    const linksRes = await fetch(`/api/admin/links?${search.toString()}`);
    if (!linksRes.ok) throw new Error("加载导航模块数据失败");
    const linksData = await readJsonSafe<{ links?: LinkItem[] }>(linksRes);
    setLinks(linksData?.links || []);
    markSectionLoaded("links");
  }, [markSectionLoaded]);

  const loadLogs = useCallback(async () => {
    try {
      const logRes = await fetch("/api/admin/logs", { cache: "no-store" });
      if (!logRes.ok) throw new Error("加载日志失败");
      const logData = await readJsonSafe<{ logs?: LinkLog[] }>(logRes);
      setLogs(logData?.logs || []);
      markSectionLoaded("logs");
    } catch {
      throw new Error("加载日志失败");
    }
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
        await Promise.all([loadOverview(), loadLinks(), loadLogs().catch(() => {})]);
        setLoadedSections({ overview: true, links: true, logs: true });
      } catch {
        setError("加载后台数据失败");
      } finally {
        setChecking(false);
      }
    };

    void init();
  }, [loadLinks, loadLogs, loadOverview, router]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => {
      setError("");
    }, ERROR_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [error]);

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
      await fetchLinksForScope(nextModule, nextModule === "resource_matrix" ? nextSubModule : undefined);
    } catch {
      setError("加载导航模块数据失败");
    }
  };

  const switchResourceSubModule = async (nextSubModule: ResourceSubModule) => {
    setActiveResourceSubModule(nextSubModule);
    setLinkForm((prev) => ({ ...prev, resource_sub_module: nextSubModule }));
    if (activeLinkModule !== "resource_matrix") return;
    try {
      await fetchLinksForScope("resource_matrix", nextSubModule);
    } catch {
      setError("加载资源矩阵子模块数据失败");
    }
  };

  const jumpToLinkFromHealth = useCallback(async (item: LinkHealth) => {
    const navModule = (item.module || "friend_links") as NavModule;
    const resourceSubModule = (item.resource_sub_module || "think_tank") as ResourceSubModule;
    setError("");
    setActiveSection("links");
    setLinksNavExpanded(true);
    setActiveLinkModule(navModule);
    if (navModule === "resource_matrix") {
      setActiveResourceSubModule(resourceSubModule);
    }
    setLinkForm((prev) => ({
      ...prev,
      module: navModule,
      resource_sub_module: navModule === "resource_matrix" ? resourceSubModule : prev.resource_sub_module,
    }));
    try {
      await fetchLinksForScope(navModule, navModule === "resource_matrix" ? resourceSubModule : undefined);
      setFocusedLinkId(item.link_id);
    } catch {
      setError("跳转到内容管理失败");
    }
  }, [fetchLinksForScope]);

  useEffect(() => {
    if (activeSection !== "links" || !focusedLinkId) return;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`admin-link-row-${focusedLinkId}`);
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeSection, focusedLinkId, links]);

  const handleSidebarSectionClick = (sectionId: string) => {
    if (sectionId === "links") {
      setLinksNavExpanded((prev) => !prev);
      scrollToSection(sectionId);
      return;
    }
    setLinksNavExpanded(false);
    scrollToSection(sectionId);
  };

  const handleSidebarModuleClick = (module: NavModule) => {
    setLinksNavExpanded(true);
    setActiveSection("links");
    void switchLinkModule(module);
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
        Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "新增链接失败"));
    }
  };

  // 删除链接后刷新相关分区数据
  const removeLink = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await readJsonSafe<{ error?: string }>(res);
        throw new Error(data?.error || "删除链接失败");
      }
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
        Promise.resolve(),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "删除链接失败"));
    }
  };

  // 打开编辑弹窗
  const openEditLink = (item: LinkItem) => {
    setEditLinkId(item.id);
    setEditForm({
      title: item.title,
      url: item.url,
      description: item.description || "",
      sort: item.sort ?? 0,
    });
  };

  // 提交编辑
  const submitEditLink = async (e: FormEvent) => {
    e.preventDefault();
    if (editLinkId === null) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/links/${editLinkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editLinkId, ...editForm }),
      });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "编辑链接失败");
      setEditLinkId(null);
      await Promise.all([
        loadLinks(),
        loadLogs().catch(() => {}),
      ]);
    } catch (err) {
      setError(String((err as Error).message || "编辑链接失败"));
    }
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
      if (!res.ok) throw new Error(data?.error || "创建用户澶辫触");
      setUserForm({ username: "", password: "", role: "editor" });
      await Promise.all([loadUsers(), loadLogs().catch(() => {})]);
    } catch (err) {
      setError(String((err as Error).message || "创建用户澶辫触"));
    }
  };

  const updateUser = async (targetUser: AdminUser, patch: Partial<Pick<AdminUser, "role">> & { password?: string }) => {
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
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, { method: "DELETE" });
      const data = await readJsonSafe<{ error?: string }>(res);
      if (!res.ok) throw new Error(data?.error || "删除用户失败");
      await Promise.all([loadUsers(), loadLogs().catch(() => {})]);
    } catch (err) {
      setError(String((err as Error).message || "删除用户失败"));
    }
  };

  const runHealthCheck = useCallback(async () => {
    if (healthChecking) return;
    setHealthChecking(true);
    setHealthProgress({ checked: 0, total: 0, failed: 0 });

    try {
      const res = await fetch("/api/admin/link-health?stream=1", { method: "POST" });
      if (!res.ok) {
        const data = await readJsonSafe<{ error?: string }>(res);
        throw new Error(data?.error || "检测失败");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr) as HealthProgress;
              if (data) {
                setHealthProgress(data);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

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
      // 检测完成后短暂延迟再隐藏进度条（让用户看到100%状态）
      setTimeout(() => setHealthProgress(null), 500);
    }
  }, [healthChecking, loadHealth]);

  const checkSingleLink = async (linkId: number) => {
    if (checkingLinkId !== null) return;
    setError("");
    setCheckingLinkId(linkId);
    try {
      const res = await fetch(`/api/admin/link-health/${linkId}`, { method: "POST" });
      const data = await readJsonSafe<{ error?: string; health?: LinkHealth }>(res);
      if (!res.ok) throw new Error(data?.error || "检测失败");
      if (data?.health) {
        setHealth((prev) => [data.health as LinkHealth, ...prev.filter((item) => item.link_id !== linkId)]);
      } else {
        await loadHealth();
      }
      void loadLogs().catch(() => {});
    } catch (err) {
      setError(String((err as Error).message || "检测失败"));
    } finally {
      setCheckingLinkId(null);
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
  }, [autoDetectEnabled, autoDetectIntervalMinutes, runHealthCheck]);

  useEffect(() => {
    if (activeSection !== "health" && activeSection !== "links") return;
    const intervalId = window.setInterval(() => {
      loadHealth().catch(() => {});
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeSection, loadHealth]);

  useEffect(() => {
    if (activeSection !== "overview") return;
    let closed = false;
    let fallbackTimer: number | null = null;
    let stream: EventSource | null = null;

    const startFallback = () => {
      if (fallbackTimer !== null) return;
      setSystemStreamState("fallback");
      loadSystem().catch(() => {});
      fallbackTimer = window.setInterval(() => {
        loadSystem().catch(() => {});
      }, 15000);
    };

    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      startFallback();
      return () => {
        if (fallbackTimer !== null) window.clearInterval(fallbackTimer);
      };
    }

    setSystemStreamState("connecting");
    stream = new EventSource("/api/admin/system/stream", { withCredentials: true });

    stream.onopen = () => {
      if (!closed) setSystemStreamState("live");
    };

    stream.addEventListener("system", (event) => {
      if (closed) return;
      try {
        setSystem(withSystemFallback(JSON.parse(event.data) as SystemInfo));
        setSystemStreamState("live");
      } catch {
        // Ignore a malformed stream frame; the next server event will replace it.
      }
    });

    stream.onerror = () => {
      stream?.close();
      stream = null;
      if (!closed) startFallback();
    };

    return () => {
      closed = true;
      stream?.close();
      if (fallbackTimer !== null) window.clearInterval(fallbackTimer);
    };
  }, [activeSection, loadSystem]);

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

  const memUsageRate = system?.mem?.usageRate;
  const hasSystemMem = typeof memUsageRate === "number" && Number.isFinite(memUsageRate);
  const processMemBytes = system?.mem?.processAllocBytes ?? system?.mem?.processSysBytes ?? null;
  const memCardLabel = hasSystemMem ? "系统内存" : "进程内存";
  const memCardValue = hasSystemMem
    ? `${memUsageRate}%`
    : processMemBytes !== null ? formatBytes(processMemBytes) : "暂无采样";
  const memCardMeta = hasSystemMem
    ? system?.mem?.usedBytes && system?.mem?.totalBytes
      ? `${formatBytes(system.mem.usedBytes)} / ${formatBytes(system.mem.totalBytes)}`
      : "系统采样"
    : processMemBytes !== null ? "Go 运行时采样" : "暂无采样";
  const networkBytes = system?.network?.totalBytes;
  const hasNetworkBytes = typeof networkBytes === "number" && Number.isFinite(networkBytes);
  const networkCardValue = hasNetworkBytes ? formatBytes(networkBytes) : "暂无采样";
  const networkCardMeta = hasNetworkBytes ? "系统网卡累计" : "本机未开放网卡统计";
  const backendService = system?.services?.backend;
  const databaseService = system?.services?.database;
  const redisService = system?.services?.redis;
  const realtimeMeta = systemStreamState === "live"
    ? "实时推送中"
    : systemStreamState === "fallback"
      ? "实时通道降级探活"
      : "实时连接中";
  const sampledAt = system?.sampledAt || system?.network?.sampledAt;
  const statsSampledAt = statsSource?.sampledAt ? formatDateTime(statsSource.sampledAt) : formatDateTime(sampledAt);
  const kpiItems = [
    { label: "访问量 PV", value: today.page_views, detail: `小时事件 ${hourlyOverview.totals.page_views}`, icon: Eye, tint: "rgba(14,165,233,0.14)", color: "#0EA5E9" },
    { label: "访客数 UV", value: today.unique_visitors, detail: `去重访客 ${hourlyOverview.totals.unique_visitors}`, icon: Users, tint: "rgba(5,150,105,0.14)", color: "#059669" },
    { label: "点击量", value: today.link_clicks, detail: `点击事件 ${hourlyOverview.totals.link_clicks}`, icon: MousePointerClick, tint: "rgba(37,99,235,0.14)", color: "#1D4ED8" },
  ];

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
        <div className="admin-console-error" style={{ color: "#B91C1C", fontSize: 13 }}>
          {error}
        </div>
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
            <div className="admin-console-pagehead-desc">优先看今日访问、点击排行和最近后台操作；内容治理与健康明细保留在对应模块。</div>
          </div>
          <div className="admin-card admin-overview-panel" style={{ padding: 14, background: "linear-gradient(135deg,#FFFFFF 0%,#F7FBFF 100%)", border: "1px solid #DCE8F8", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div className="admin-console-title-row">
                <span className="admin-console-icon-badge" style={{ background: "rgba(37,99,235,0.12)", color: "#1D4ED8" }}>
                  <ServerCog size={16} />
                </span>
                <div style={{ fontWeight: 800, color: "#0F172A" }}>运行状态</div>
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                采样：{formatDateTime(sampledAt)} · {realtimeMeta}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {[
                { label: "前端网关", value: system ? "在线" : "等待采样", meta: realtimeMeta, icon: Radio, color: system ? "#059669" : "#64748B", bg: "rgba(5,150,105,0.12)" },
                { label: "后端 API", value: serviceValue(backendService), meta: serviceMeta(backendService), icon: ShieldCheck, color: isServiceOnline(backendService) ? "#059669" : "#DC2626", bg: isServiceOnline(backendService) ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)" },
                { label: "数据库", value: serviceValue(databaseService), meta: serviceMeta(databaseService), icon: Database, color: isServiceOnline(databaseService) ? "#059669" : "#DC2626", bg: isServiceOnline(databaseService) ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)" },
                { label: "Redis", value: serviceValue(redisService), meta: serviceMeta(redisService), icon: ServerCog, color: isServiceOnline(redisService) ? "#059669" : "#DC2626", bg: isServiceOnline(redisService) ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)" },
                { label: "运行时长", value: formatDurationFromSec(system?.uptimeSec ?? 0), meta: "后端进程", icon: Clock3, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
                { label: memCardLabel, value: memCardValue, meta: memCardMeta, icon: Gauge, color: "#0EA5E9", bg: "rgba(14,165,233,0.12)" },
                { label: "网络流量", value: networkCardValue, meta: networkCardMeta, icon: Activity, color: hasNetworkBytes ? "#7C3AED" : "#64748B", bg: hasNetworkBytes ? "rgba(124,58,237,0.12)" : "rgba(100,116,139,0.12)" },
              ].map((item) => (
                <div key={item.label} style={{ border: "1px solid #E2E8F0", borderRadius: 10, background: "#FFFFFF", padding: 12, display: "grid", gap: 8, minHeight: 92 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{item.label}</span>
                    <span className="admin-console-icon-badge" style={{ width: 30, height: 30, background: item.bg, color: item.color }}>
                      <item.icon size={14} />
                    </span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap" }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.meta}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-overview-quick-grid" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
            <div className="admin-card admin-overview-panel" style={{ flex: "0 1 360px", width: "min(100%, 360px)", minWidth: "min(100%, 280px)", padding: 14, display: "grid", gap: 12, alignContent: "start", background: "#FFFFFF", borderColor: "#E2E8F0", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div className="admin-console-title-row">
                  <span className="admin-console-icon-badge" style={{ background: "rgba(14,165,233,0.14)", color: "#0EA5E9" }}>
                    <BarChart3 size={15} />
                  </span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>今日流量</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{statsSampledAt}</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {kpiItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid #EEF2F7",
                      borderRadius: 8,
                      padding: "10px 12px",
                      background: "#F8FAFC",
                      minHeight: 64,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{item.detail}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="admin-console-icon-badge" style={{ background: item.tint, color: item.color }}>
                        <item.icon size={14} />
                      </span>
                      <span style={{ fontSize: 24, color: item.color, fontWeight: 850, lineHeight: 1 }}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-card admin-overview-panel" style={{ flex: "1 1 280px", minWidth: "min(100%, 280px)", padding: 14, display: "grid", gap: 12, alignContent: "start", background: "#FFFFFF", borderColor: "#E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="admin-console-title-row">
                  <span className="admin-console-icon-badge" style={{ background: "rgba(37,99,235,0.12)", color: "#2563EB" }}>
                    <TrendingUp size={15} />
                  </span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>今日点击排行</div>
                </div>
                <span style={{ fontSize: 12, color: "#64748B" }}>{topClicks.length ? "Top 5" : "暂无点击"}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {topClicks.length ? topClicks.map((item, index) => (
                  <div key={`${item.link_id || item.url || item.title}-${index}`} style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", gap: 10, alignItems: "center", border: "1px solid #F1F5F9", borderRadius: 10, padding: "9px 10px", background: index === 0 ? "#F8FAFF" : "#FFFFFF" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center", background: index === 0 ? "#DBEAFE" : "#F1F5F9", color: index === 0 ? "#1D4ED8" : "#64748B", fontSize: 12, fontWeight: 800 }}>
                      {index + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || "未命名链接"}</div>
                      <div style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {moduleLabel(item.module, item.resource_sub_module)}
                        {item.url ? ` · ${item.url}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>{Number(item.clicks || 0)}</div>
                  </div>
                )) : (
                  <div style={{ border: "1px dashed #CBD5E1", borderRadius: 10, padding: 14, color: "#64748B", fontSize: 13, background: "#F8FAFC" }}>
                    今日还没有可排序的点击事件。
                  </div>
                )}
              </div>
            </div>

            <div className="admin-card admin-overview-panel" style={{ flex: "1 1 280px", minWidth: "min(100%, 280px)", padding: 14, display: "grid", gap: 12, alignContent: "start", background: "#FFFFFF", borderColor: "#E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="admin-console-title-row">
                  <span className="admin-console-icon-badge" style={{ background: "rgba(15,118,110,0.12)", color: "#0F766E" }}>
                    <ListChecks size={15} />
                  </span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>最近操作</div>
                </div>
                <button type="button" onClick={() => scrollToSection("logs")} className="admin-btn-ghost" style={{ height: 30, padding: "0 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  查看全部 <ArrowRight size={13} />
                </button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {recentLogs.length ? recentLogs.map((log) => {
                  const tag = getActionTag(log.action);
                  return (
                    <div key={log.id} style={{ border: "1px solid #F1F5F9", borderRadius: 10, padding: "9px 10px", display: "grid", gap: 5, background: "#FFFFFF" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: tag.fg, background: tag.bg }}>
                          {tag.text}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{formatDateTime(log.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatLogObjectAndDetail(log)}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{log.actor_username || "-"} · {log.actor_role || "-"}</div>
                    </div>
                  );
                }) : (
                  <div style={{ border: "1px dashed #CBD5E1", borderRadius: 10, padding: 14, color: "#64748B", fontSize: 13, background: "#F8FAFC" }}>
                    暂无后台操作日志。
                  </div>
                )}
              </div>
            </div>
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
                    按小时展示访问量、访客数与点击量的变化趋势。{hourlyDataNote}
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
                  {hourlyOverview.hovered
                    ? `${String(hourlyOverview.hovered.hour).padStart(2, "0")}:00 - ${String(hourlyOverview.hovered.hour).padStart(2, "0")}:59`
                    : hasHourlyDetail ? "今日累计（小时明细）" : "今日累计（日统计）"}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {(Object.keys(STAT_METRIC_META) as StatMetricKey[]).map((metricKey) => {
                    const value = hourlyOverview.hovered
                      ? Number(hourlyOverview.hovered[metricKey] || 0)
                      : hasHourlyDetail ? Number(hourlyOverview.totals[metricKey] || 0) : Number(today[metricKey] || 0);
                    return (
                      <span key={`hourly-overview-${metricKey}`} style={{ fontSize: 12, color: STAT_METRIC_META[metricKey].color, fontWeight: 700 }}>
                        {STAT_METRIC_META[metricKey].label}：{value}
                      </span>
                    );
                  })}
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
                {["序号", "标题", "URL", "点击次数", "创建时间", "健康状态", "操作"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((item, index) => (
                <tr
                  key={item.id}
                  id={`admin-link-row-${item.id}`}
                  style={focusedLinkId === item.id ? { background: "#EFF6FF" } : undefined}
                >
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{index + 1}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>{item.title}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>
                    <PortalTooltip
                      trigger={item.url}
                      content={item.description || undefined}
                      id={`admin-link-url-tooltip-${item.id}`}
                      title={item.description || item.url}
                    />
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", fontVariantNumeric: "tabular-nums" }}>{Number(item.click_count || 0)}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>
                    {item.created_at ? String(item.created_at).replace("T", " ").slice(0, 19) : "-"}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", fontWeight: 600 }}>
                    {(() => {
                      const h = healthMapByLinkId.get(item.id);
                      const isChecking = checkingLinkId === item.id;
                      if (isChecking) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="admin-link-health-trigger admin-link-health-trigger--checking"
                          >
                            检测中...
                          </button>
                        );
                      }
                      if (!h) {
                        return (
                          <button
                            type="button"
                            onClick={() => checkSingleLink(item.id)}
                            className="admin-link-health-trigger admin-link-health-trigger--unknown"
                          >
                            未检测
                          </button>
                        );
                      }
                      if (isHealthOk(h)) {
                        return (
                          <button
                            type="button"
                            onClick={() => checkSingleLink(item.id)}
                            className="admin-link-health-trigger admin-link-health-trigger--ok"
                          >
                            有效
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => checkSingleLink(item.id)}
                          className="admin-link-health-trigger admin-link-health-trigger--bad"
                        >
                          异常
                        </button>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => openEditLink(item)} className="admin-btn-ghost" style={{ color: "#1D4ED8", borderColor: "#93C5FD" }}>编辑</button>
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

      {/* 编辑链接弹窗 */}
      {editLinkId !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setEditLinkId(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitEditLink}
            style={{ background: "#fff", borderRadius: 14, padding: 28, width: 520, maxWidth: "90vw", boxShadow: "0 24px 64px rgba(15,23,42,0.18)", display: "grid", gap: 16 }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>编辑链接</div>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>标题</span>
              <input className="admin-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>URL</span>
              <input className="admin-input" value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>描述</span>
              <input className="admin-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>排序</span>
              <input className="admin-input" type="number" value={editForm.sort} onChange={(e) => setEditForm({ ...editForm, sort: Number(e.target.value || 0) })} />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setEditLinkId(null)} className="admin-btn-ghost" style={{ color: "#334155" }}>取消</button>
              <button type="submit" className="admin-btn" style={{ background: "#1890FF", color: "#fff" }}>保存</button>
            </div>
          </form>
        </div>
      )}

      {activeSection === "health" ? (
      <div className="admin-section-transition">
      <div className="admin-card admin-console-pagehead" style={{ padding: 18, border: "1px solid #E6ECF5", background: "linear-gradient(180deg,#FFFFFF 0%,#F8FBFF 100%)" }}>
        <div className="admin-console-pagehead-title">链接健康检测</div>
        <div className="admin-console-pagehead-desc">逐个探测所有启用链接；下方仅展示异常对象，正常状态在内容管理中查看。</div>
      </div>
      <div id="health" className="admin-card" style={{ padding: 20, background: "#F3F6FA", border: "1px solid #E6ECF5", borderRadius: 12, display: "grid", gap: 16, boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14, boxShadow: "inset 0 0 0 1px rgba(24,144,255,0.06)" }}>
            <div style={{ fontSize: 12, color: "#64748B", letterSpacing: 0.2 }}>健康度评估</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1890FF" }}>
              {health.length ? `${Math.round(((health.length - failedHealth.length) / health.length) * 100)}%` : "-"}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>已检测项</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{health.length}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>异常</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{failedHealth.length}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#64748B" }}>最近探测</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>{latestHealthCheckedAt}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E8EEF6", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            {/* 进度条看板 - 仅手动触发时显示 */}
            {healthProgress && healthProgress.total > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 280,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 0, marginBottom: 4, height: 8 }}>
                    <div style={{
                      width: `${Math.min(100, (healthProgress.checked / healthProgress.total) * 100)}%`,
                      height: 8,
                      borderRadius: "4px 0 0 4px",
                      background: "linear-gradient(90deg, #93C5FD, #2563EB)",
                      transition: "width 0.15s ease",
                    }} />
                    <div style={{
                      flex: 1,
                      height: 8,
                      borderRadius: "0 4px 4px 0",
                      background: "#E2E8F0",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>
                    {Math.round((healthProgress.checked / healthProgress.total) * 100)}%
                    · {healthProgress.checked}/{healthProgress.total}
                    {healthProgress.failed > 0 && <span style={{ color: "#DC2626", marginLeft: 4 }}>异常 {healthProgress.failed}</span>}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>监控对象状态面板</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {autoDetectEnabled
                  ? `自动检测已开启：每 ${autoDetectIntervalMinutes} 分钟执行一次${lastAutoDetectAt ? `，最近一次 ${lastAutoDetectAt.replace("T", " ").slice(0, 19)}` : ""}`
                  : "自动检测未开启"}
              </div>
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
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>来源</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>探测状态</th>
                <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #E8EEF6", color: "#334155", fontWeight: 600 }}>最近探测时间</th>
              </tr>
            </thead>
            <tbody>
              {failedHealth.map((h) => (
                <tr key={h.link_id} style={{ background: "#FFF1F0" }}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#0F172A" }}>
                    <button
                      type="button"
                      onClick={() => { void jumpToLinkFromHealth(h); }}
                      className="admin-btn-ghost"
                      style={{ padding: "2px 8px", height: "auto", borderRadius: 6 }}
                    >
                      {h.title || `#${h.link_id}`}
                    </button>
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155" }}>
                    {moduleLabel(h.module, h.resource_sub_module)}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ color: "#DC2626", fontWeight: 700 }}>
                      {healthStatusText(h)}
                    </span>
                    {h.message ? <span style={{ marginLeft: 8, fontSize: 12, color: "#64748B" }}>{h.message}</span> : null}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #F1F5F9", color: "#334155" }} title={String(h.checked_at || "")}>
                    {formatHealthCheckedAt(h.checked_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!failedHealth.length ? (
            <div style={{ padding: "14px", color: "#64748B", fontSize: 13, borderTop: "1px solid #F1F5F9" }}>
              当前没有异常链接
            </div>
          ) : null}
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
  const detail = "detail" in log ? toHumanDetail(log) : "-";
  if (target === "-" && detail === "-") return "-";
  if (target === "-") return detail;
  if (detail === "-") return target;
  return `${target} | ${detail}`;
}
