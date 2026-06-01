"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Tag,
  GitFork,
  Plus,
  MessageSquareText,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  GITHUB_ORG,
  MOCK_ACTIVITY,
} from "@/data/githubActivity";

type ActivityItem = {
  id: string | number;
  type: string;
  color: string;
  time: string;
  message: string;
  details?: string[];
  actor: { avatar: string; login: string; avatarUrl?: string | null };
  repo: string;
  branch?: string | null;
  commits?: number;
  isMergedPr?: boolean;
};

const EVENT_ICONS = {
  PushEvent: GitCommit,
  PullRequestEvent: GitPullRequest,
  PullRequestReviewEvent: GitPullRequest,
  PullRequestReviewCommentEvent: MessageSquareText,
  CreateEvent: Plus,
  DeleteEvent: Trash2,
  IssuesEvent: AlertCircle,
  IssueCommentEvent: MessageSquareText,
  ReleaseEvent: Tag,
  ForkEvent: GitFork,
  WatchEvent: Star,
};

const PANEL_WIDTH = "clamp(238px, 18vw, 296px)";
const DEFAULT_ACTIVITY_LIMIT = 20;
const EXPANDED_ACTIVITY_LIMIT = 100;

function ActivityCard({
  item,
  index,
  isDarkMode,
}: {
  item: ActivityItem;
  index: number;
  isDarkMode: boolean;
}) {
  const Icon = EVENT_ICONS[item.type as keyof typeof EVENT_ICONS] || GitCommit;
  const label =
    EVENT_TYPE_LABELS[item.type as keyof typeof EVENT_TYPE_LABELS] || "EVENT";

  return (
    <div
      data-ui-touch="true"
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${isDarkMode ? "#334155" : "#F1F5F9"}`,
        background: isDarkMode ? "#111827" : "#FAFBFC",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        animation: `slideIn 0.3s ease ${index * 0.05}s both`,
        transition:
          "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isDarkMode ? "#475569" : "#E2E8F0";
        e.currentTarget.style.background = isDarkMode ? "#0F172A" : "#FFFFFF";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(15,23,42,0.16)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDarkMode ? "#334155" : "#F1F5F9";
        e.currentTarget.style.background = isDarkMode ? "#111827" : "#FAFBFC";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${item.color}12`,
          border: `1px solid ${item.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={13} color={item.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              padding: "1px 6px",
              borderRadius: 999,
              background: `${item.color}12`,
              color: item.color,
              fontWeight: 600,
              letterSpacing: 0.5,
              fontFamily: '"Courier New", monospace',
              flexShrink: 0,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 9,
              color: isDarkMode ? "#64748B" : "#CBD5E1",
              fontFamily: '"Courier New", monospace',
            }}
          >
            {item.time}
          </span>
        </div>

        <div
          style={{
            fontSize: 12,
            color: isDarkMode ? "#E2E8F0" : "#374151",
            marginTop: 4,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.message}
        </div>

        {Array.isArray(item.details) && item.details.length > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {item.details.slice(0, 3).map((detail: string, detailIndex: number) => (
              <div
                key={`${item.id}-detail-${detailIndex}`}
                style={{
                  fontSize: 10,
                  lineHeight: 1.45,
                  color: isDarkMode ? "#CBD5E1" : "#64748B",
                  background: isDarkMode ? "#0F172A" : "#F8FAFC",
                  border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                  borderRadius: 6,
                  padding: "4px 6px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={detail}
              >
                {detail}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: `${item.color}18`,
              border: `1px solid ${item.color}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 7,
              fontWeight: 700,
              color: item.color,
              overflow: "hidden",
            }}
          >
            {item.actor.avatarUrl ? (
              <img
                src={item.actor.avatarUrl}
                alt={item.actor.login}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              item.actor.avatar
            )}
          </div>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>{item.actor.login}</span>
          <span style={{ fontSize: 10, color: isDarkMode ? "#64748B" : "#CBD5E1" }}>•</span>
          <span
            style={{
              fontSize: 10,
              color: "#94A3B8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.repo.split("/")[1] || item.repo}
          </span>
        </div>

        <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {item.branch && (
            <div
              style={{
                fontSize: 9,
                color: "#94A3B8",
                fontFamily: '"Courier New", monospace',
                background: isDarkMode ? "#0F172A" : "#F8FAFC",
                border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                borderRadius: 4,
                padding: "1px 6px",
                display: "inline-block",
              }}
            >
              分支 {item.branch}
            </div>
          )}
          {(item.commits || 0) > 0 && (
            <div
              style={{
                fontSize: 9,
                color: item.color,
                fontFamily: '"Courier New", monospace',
                background: `${item.color}12`,
                border: `1px solid ${item.color}24`,
                borderRadius: 4,
                padding: "1px 6px",
                display: "inline-block",
              }}
            >
              {item.commits || 0} commit{(item.commits || 0) > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getDiffLabel = (updatedAt: Date, nowTs: number) => {
  const diffSec = Math.max(0, Math.floor((nowTs - updatedAt.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} 秒前`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} 分钟前`;
};

export default function RightPanel({
  isDarkMode = false,
  embedded = false,
}: {
  isDarkMode?: boolean;
  embedded?: boolean;
}) {
  const [activity, setActivity] = useState<ActivityItem[]>(
    MOCK_ACTIVITY as ActivityItem[],
  );
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [source, setSource] = useState("mock");
  const [notice, setNotice] = useState("正在尝试连接 GitHub API...");
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [activityLimit, setActivityLimit] = useState(DEFAULT_ACTIVITY_LIMIT);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    if (fetchAbortRef.current) fetchAbortRef.current.abort();

    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const response = await fetch(`/api/activities?limit=${activityLimit}`, {
        method: "GET",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`activities ${response.status}`);

      const payload = await response.json();
      const items: ActivityItem[] = Array.isArray(payload?.activities)
        ? (payload.activities as ActivityItem[])
        : [];
      if (controller.signal.aborted) return;

      if (items.length > 0) {
        setActivity(items as ActivityItem[]);
        setSource(payload?.source === "github" ? "github" : "mock");
        setNotice(
          payload?.source === "github"
            ? `已连接 ${GITHUB_ORG} 的实时动态`
            : "",
        );
      } else {
        setActivity(MOCK_ACTIVITY as ActivityItem[]);
        setSource("mock");
        setNotice("GitHub 暂无可用数据，已回退到本地模拟数据。");
      }
    } catch {
      if (controller.signal.aborted) return;
      setActivity(MOCK_ACTIVITY as ActivityItem[]);
      setSource("mock");
      setNotice("GitHub API 请求失败，已回退到本地模拟数据。");
    } finally {
      if (!controller.signal.aborted) {
        setLastUpdated(new Date());
        setNowTs(Date.now());
        setLoading(false);
      }
    }
  }, [activityLimit]);

  useEffect(() => {
    const initialRefreshId = setTimeout(() => {
      void refresh();
    }, 0);
    const refreshId = setInterval(() => {
      refresh({ silent: true });
    }, 60000);
    const tickId = setInterval(() => {
      setNowTs(Date.now());
    }, 10000);

    return () => {
      clearTimeout(initialRefreshId);
      clearInterval(refreshId);
      clearInterval(tickId);
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
    };
  }, [refresh]);

  const diffLabel = getDiffLabel(lastUpdated, nowTs);
  const sourceLabel = source === "github" ? "LIVE" : "";

  const stats = useMemo(() => {
    const commits = activity.reduce((sum, item) => sum + (item.commits || 0), 0);
    const memberSet = new Set(activity.map((item) => item.actor?.login).filter(Boolean));
    const mergedPr = activity.filter(
      (item) => item.type === "PullRequestEvent" && item.isMergedPr,
    ).length;

    return { commits, activeMembers: memberSet.size, mergedPr };
  }, [activity]);

  return (
    <aside
      style={{
        width: embedded ? "100%" : PANEL_WIDTH,
        minWidth: embedded ? "100%" : PANEL_WIDTH,
        background: isDarkMode ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.9)",
        borderLeft: embedded ? "none" : `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
        borderTop: embedded ? `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}` : "none",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        borderRadius: embedded ? 16 : 0,
      }}
    >
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: `1px solid ${isDarkMode ? "#334155" : "#F1F5F9"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: embedded ? -1 : 0,
          background: isDarkMode ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
            成员动态
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, letterSpacing: 0.5 }}>
            更新于 {diffLabel} • {sourceLabel}
          </div>
        </div>
        <button
          onClick={() => refresh()}
          data-ui-touch="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: `1px solid ${isDarkMode ? "#475569" : "#E5E7EB"}`,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 5px 10px rgba(15,23,42,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="刷新动态"
        >
          <RefreshCw
            size={13}
            color={isDarkMode ? "#CBD5E1" : "#94A3B8"}
            style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
          />
        </button>
      </div>

      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${isDarkMode ? "#334155" : "#F1F5F9"}` }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: source === "github" ? "#F0FDF4" : "#FFF7ED",
            border: source === "github" ? "1px solid #BBF7D0" : "1px solid #FED7AA",
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: 9,
            color: source === "github" ? "#059669" : "#EA580C",
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: source === "github" ? "#10B981" : "#EA580C",
              animation: "pulse 2s infinite",
            }}
          />
          {sourceLabel}
        </div>

        <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.4, minWidth: 0, flex: 1 }}>
            {source === "github" ? "GitHub 实时动态已同步显示。" : notice}
          </div>
          <button
            onClick={() =>
              setActivityLimit((current) =>
                current === DEFAULT_ACTIVITY_LIMIT
                  ? EXPANDED_ACTIVITY_LIMIT
                  : DEFAULT_ACTIVITY_LIMIT,
              )
            }
            data-ui-touch="true"
            style={{
              borderRadius: 999,
              border: `1px solid ${isDarkMode ? "#475569" : "#E5E7EB"}`,
              background: "transparent",
              color: isDarkMode ? "#CBD5E1" : "#475569",
              fontSize: 9,
              fontWeight: 600,
              padding: "4px 8px",
              cursor: "pointer",
              letterSpacing: 0.3,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            title={activityLimit === DEFAULT_ACTIVITY_LIMIT ? "展开至 100 条" : "收起至 20 条"}
          >
            {activityLimit === DEFAULT_ACTIVITY_LIMIT ? "展开 100 条" : "收起 20 条"}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {activity.map((item, i) => (
          <ActivityCard key={`${item.id}-${i}`} item={item} index={i} isDarkMode={isDarkMode} />
        ))}
      </div>

      <div
        style={{
          padding: "12px 14px",
          borderTop: `1px solid ${isDarkMode ? "#334155" : "#F1F5F9"}`,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {[
          { label: "总提交", value: String(stats.commits), color: "#0A84FF" },
          { label: "活跃成员", value: String(stats.activeMembers), color: "#06E5CC" },
          { label: "已合并 PR", value: String(stats.mergedPr), color: "#10B981" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: s.color,
                fontFamily: '"Courier New", monospace',
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
}
