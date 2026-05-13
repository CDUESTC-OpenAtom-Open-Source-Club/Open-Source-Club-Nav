import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Tag,
  GitFork,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  GITHUB_ORG,
  MOCK_ACTIVITY,
  fetchOrgActivity,
} from "../data/githubActivity";

const EVENT_ICONS = {
  PushEvent: GitCommit,
  PullRequestEvent: GitPullRequest,
  CreateEvent: Plus,
  IssuesEvent: AlertCircle,
  ReleaseEvent: Tag,
  ForkEvent: GitFork,
};

const PANEL_WIDTH = "clamp(238px, 18vw, 296px)";

function ActivityCard({ item, index, isDarkMode }) {
  const Icon = EVENT_ICONS[item.type] || GitCommit;
  const label = EVENT_TYPE_LABELS[item.type] || "EVENT";

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
            }}
          >
            {item.actor.avatar}
          </div>
          <span
            style={{ fontSize: 10, color: isDarkMode ? "#94A3B8" : "#94A3B8" }}
          >
            {item.actor.login}
          </span>
          <span
            style={{ fontSize: 10, color: isDarkMode ? "#64748B" : "#CBD5E1" }}
          >
            ·
          </span>
          <span
            style={{
              fontSize: 10,
              color: isDarkMode ? "#94A3B8" : "#94A3B8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.repo.split("/")[1] || item.repo}
          </span>
        </div>

        {item.branch && (
          <div
            style={{
              marginTop: 4,
              fontSize: 9,
              color: isDarkMode ? "#94A3B8" : "#94A3B8",
              fontFamily: '"Courier New", monospace',
              background: isDarkMode ? "#0F172A" : "#F8FAFC",
              border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
              borderRadius: 4,
              padding: "1px 6px",
              display: "inline-block",
            }}
          >
            ↳ {item.branch}
          </div>
        )}
      </div>
    </div>
  );
}

const getDiffLabel = (updatedAt, nowTs) => {
  const diffSec = Math.max(0, Math.floor((nowTs - updatedAt.getTime()) / 1000));
  if (diffSec < 60) {
    return `${diffSec} 秒前`;
  }
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} 分钟前`;
};

export default function RightPanel({ isDarkMode = false }) {
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [source, setSource] = useState("mock");
  const [notice, setNotice] = useState("正在尝试连接 GitHub API...");
  const [nowTs, setNowTs] = useState(Date.now());
  const fetchAbortRef = useRef(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }

    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const items = await fetchOrgActivity({
        org: GITHUB_ORG,
        perPage: 12,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      if (Array.isArray(items) && items.length > 0) {
        setActivity(items);
        setSource("github");
        setNotice(`已连接组织 ${GITHUB_ORG} 的公开事件流`);
      } else {
        setActivity(MOCK_ACTIVITY);
        setSource("mock");
        setNotice("GitHub 暂无公开事件，已回退到示例数据");
      }
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setActivity(MOCK_ACTIVITY);
      setSource("mock");
      setNotice("GitHub API 拉取失败，已回退到示例数据");
    } finally {
      if (!controller.signal.aborted) {
        setLastUpdated(new Date());
        setNowTs(Date.now());
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const refreshId = setInterval(() => {
      refresh({ silent: true });
    }, 60000);
    const tickId = setInterval(() => {
      setNowTs(Date.now());
    }, 10000);

    return () => {
      clearInterval(refreshId);
      clearInterval(tickId);
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }
    };
  }, [refresh]);

  const diffLabel = getDiffLabel(lastUpdated, nowTs);

  const stats = useMemo(() => {
    const commits = activity.reduce(
      (sum, item) => sum + (item.commits || 0),
      0,
    );
    const memberSet = new Set(
      activity.map((item) => item.actor?.login).filter(Boolean),
    );
    const mergedPr = activity.filter(
      (item) => item.type === "PullRequestEvent" && item.isMergedPr,
    ).length;

    return {
      commits,
      activeMembers: memberSet.size,
      mergedPr,
    };
  }, [activity]);

  return (
    <aside
      style={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        background: isDarkMode
          ? "rgba(15,23,42,0.92)"
          : "rgba(255,255,255,0.9)",
        borderLeft: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
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
          top: 0,
          background: isDarkMode
            ? "rgba(15,23,42,0.95)"
            : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDarkMode ? "#F8FAFC" : "#0F172A",
            }}
          >
            成员动态
          </div>
          <div
            style={{
              fontSize: 9,
              color: isDarkMode ? "#94A3B8" : "#94A3B8",
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            更新于 {diffLabel} ·{" "}
            {source === "github" ? "GITHUB API" : "MOCK FALLBACK"}
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
            style={{
              animation: loading ? "spin 0.8s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${isDarkMode ? "#334155" : "#F1F5F9"}`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: source === "github" ? "#F0FDF4" : "#FFF7ED",
            border:
              source === "github" ? "1px solid #BBF7D0" : "1px solid #FED7AA",
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
          {source === "github" ? `ORG: ${GITHUB_ORG}` : "MOCK DATA"}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 9,
            color: isDarkMode ? "#94A3B8" : "#94A3B8",
            lineHeight: 1.5,
          }}
        >
          {notice}
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
          <ActivityCard
            key={`${item.id}-${i}`}
            item={item}
            index={i}
            isDarkMode={isDarkMode}
          />
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
          { label: "提交数", value: String(stats.commits), color: "#0A84FF" },
          {
            label: "活跃成员",
            value: String(stats.activeMembers),
            color: "#06E5CC",
          },
          { label: "合并 PR", value: String(stats.mergedPr), color: "#10B981" },
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
            <div
              style={{
                fontSize: 9,
                color: isDarkMode ? "#94A3B8" : "#94A3B8",
                marginTop: 1,
              }}
            >
              {s.label}
            </div>
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
